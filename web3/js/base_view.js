import CN_api from "./api.js"
import CN_common from "./common.js"
import CN_element from "./element.js"
import CN_event from "./event.js"
import CN_session from "./session.js"

import { CN_base_action } from "./base_action.js"

export class CN_base_view extends CN_base_action {
  #properties;
  #record = {};
  #tab = null;

  // getters and setters
  get properties() { return this.#properties }
  get record() { return this.#record }

  /**
   * ADD DOCS
   */
  constructor(parent_model, properties) {
    super(parent_model);

    // setup each property
    this.#properties = CN_common.clone(properties);
    for (var prop_name in this.#properties) {
      const prop = this.#properties[prop_name];
      prop.id = [this.parent_model.unique_id, prop_name].join("-");
      if (!prop.type) prop.type = "string";

      if ("typeahead" == prop.type) {
        if (!prop.typeahead) prop.typeahead = {};
        if (!prop.typeahead.min_length) prop.typeahead.min_length = 2;
        if (!prop.typeahead.list) prop.typeahead.list = [];
        if (!prop.typeahead.on_cancel) {
          prop.typeahead.on_cancel = (el) => {
            // put the record's value back
            el.value = this.get_record_label(el.getAttribute("name"));
          };
        }
        if (!prop.typeahead.on_select) {
          prop.typeahead.on_select = (el) => {
            // update the property with the new selection
            this.on_change(el.getAttribute("name"));
          };
        }
      }

      if (["integer", "float"].includes(prop.type)) {
        prop.min = this.#properties.hasOwnProperty("min") ? this.#properties.min : null;
        prop.max = this.#properties.hasOwnProperty("max") ? this.#properties.max : null;
      }

      if (!CN_common.is_function(prop.is_constant)) prop.is_constant = () => false;
      if (!CN_common.is_function(prop.is_hidden)) prop.is_hidden = () => false;
    }
  }

  /**
   * ADD DOCS
   */
  get_record_label(col_name) {
    return (
      undefined !== this.#record[`formatted_${col_name}`] ?
      this.#record[`formatted_${col_name}`] :
      this.#record[col_name]
    );
  }

  /**
   * ADD DOCS
   */
  get_text(type) {
    if ("name" == type) {
      return (
        this.#record.hasOwnProperty("name") ? this.get_record_label("name") :
        this.#record.hasOwnProperty("title") ? this.get_record_label("title") :
        undefined
      );
    }

    if ("header" == type) {
      return `${CN_common.uc_words(this.parent_model.name.singular)} Details`;
    }

    if ("view_parent" == type) {
      const parent_module = this.parent_model.get_parent_module();
      return (
        parent_module ?
        `View ${CN_common.uc_words(parent_module.model.name.singular)}` :
        `View ${CN_common.uc_words(this.parent_model.name.singular)} List`
      );
    }

    return super.get_text(type);
  }

  /**
   * ADD DOCS
   */
  async on_load() {
    // load dynamic enums
    const promise_list = [];
    for (var prop_name in this.#properties) {
      const module_prop = this.parent_model.module.properties[prop_name];
      const prop = this.#properties[prop_name];

      if ("enum" == prop.type) {
        if (CN_common.is_object(prop.enum) && prop.enum.path) {
          // populate the enum
          const params = {
            select: prop.enum.select ? prop.enum.select : { column: "name" },
            modifier: prop.enum.modifier ? prop.enum.modifier : { order: "name" },
          };

          // create an async function and add it to the promise list so they can be run in parallel
          const get_enums = async () => {
            const response = await CN_api.get(prop.enum.path, params);
            prop.enum.values = (await response.json()).reduce((list, record) => {
              list.push({ key: record.id, value: record.name });
              return list;
            }, []);
          }
          promise_list.push(get_enums());
        } else {
          // enum properties without an enum path use the column definition
          let matches = module_prop ? module_prop.type.match(/^enum\('(.+)'\)$/) : null;
          if (null == matches) {
            throw new Error(`Property ${prop_name} has no valid enum values.`);
          } else {
            prop.enum = { values: matches[1].split("','").map(v => ({ key: v, value: v })) };
          }
        }
      }
    }
    await Promise.all(promise_list);

    // load the record
    const response = await CN_api.get(
      `${this.parent_model.module.subject}/${this.parent_model.module.operation.identifier}`
    );
    this.#record = await response.json();
  }

  /**
   * ADD DOCS
   */
  show_placeholder() {
    super.show_placeholder();

    // Replace the property elements with placeholders
    for (const prop_name in this.#properties) {
      const prop = this.#properties[prop_name];
      const prop_el = this.element.querySelector(`[name=${prop.id}]`);
      if (prop.element) {
        if (null == prop_el.querySelector("[name=placeholder]")) {
          prop_el.replaceChild(prop.placeholder_el, prop.element);
        }
      }
    }
  }

  /**
   * ADD DOCS
   */
  hide_placeholder() {
    super.hide_placeholder();

    // Replace the placeholders with the property elements
    for (const prop_name in this.#properties) {
      const prop = this.#properties[prop_name];
      const prop_el = this.element.querySelector(`[name=${prop.id}]`);
      if (prop.element) {
        prop_el.replaceChild(prop.element, prop_el.querySelector("[name=placeholder]"));
      }
    }
  }

  async on_change(prop_name) {
    const prop = this.#properties[prop_name];
    const control_el = document.getElementById(prop.id);

    try {
      // update the server
      let data = {};
      data[prop_name] = control_el.value;
      if ("boolean" == prop.type) {
        data[prop_name] = "" == data[prop_name] ? null : Number(data[prop_name]);
      } else if ("date" == prop.type) {
        if ("" == data[prop_name]) data[prop_name] = null;
      } else if ("typeahead" == prop.type) {
        // convert from label to value by looking up the element's typeahead list in the params object
        // NOTE: this is not the same as the property's params object (it is copied when the element is created)
        data[prop_name] = prop.element.params.typeahead.list.find(item => control_el.value === item.label).value;
      }

      await CN_api.patch(
        `${this.parent_model.module.subject}/${this.parent_model.module.operation.identifier}`,
        data
      );

      // update the record
      this.#record[prop_name] = data[prop_name];
    } catch (error) {
      if ("Conflict (409)" == error.name) {
        JSON.parse(error.body).forEach(prop_name => {
          const prop = this.#properties[prop_name];
          const prop_el = this.element.querySelector(`[name=${prop.id}]`);
          const control_el = document.getElementById(prop.id);
          prop.element.show_error("Conflicts with existing record", 5000);
        });
      } else {
        this.run();
        throw error;
      }
    }

    await this.run();
  }

  /**
   * ADD DOCS
   */
  async on_delete() {
    // first confirm
    const modal = CN_event.modal_confirm({
      static: true,
      title: "Please Confirm",
      message: `
        Are you sure you wish to delete this ${this.parent_model.name.singular}?
      `,
    });

    if (await modal.test()) {
      await CN_api.delete(
        `${this.parent_model.module.subject}/${this.parent_model.module.operation.identifier}`
      );

      await this.on_navigate_to_parent();
    }
  }

  /**
   * ADD DOCS
   */
  update_element() {
    super.update_element();

    for (const prop_name in this.#properties) {
      const module_prop = this.parent_model.module.properties[prop_name];
      const prop = this.#properties[prop_name];
      const control_el = document.getElementById(prop.id);
      if (null == control_el) return;

      const prop_el = this.element.querySelector(`[name=${prop.id}]`);

      // remove any properties that evaluate to hidden
      if (prop.is_hidden(this)) {
        prop_el.style.display = "none";
      } else {
        prop_el.style.removeProperty("display");
      }

      // disable any properties that evaluate to constant
      control_el.disabled = prop.is_constant(this);

      // rebuild enum select options
      if (["boolean", "enum"].includes(prop.type)) {
        if ("boolean" == prop.type) {
        } else if ("enum" == prop.type) {
          control_el.innerHTML = module_prop && module_prop.required ? "" : `<option value="">(empty)</option>`;
          prop.enum.values.forEach(option => {
            control_el.append(CN_element.create(`
              <option value="${option.key}">${option.value}</option>
            `));
          });
        }

        control_el.querySelectorAll("option").forEach(option_el => {
          if (
            ("" == option_el.value && null === this.#record[prop_name]) ||
            (1 == option_el.value && true === this.#record[prop_name]) ||
            (0 == option_el.value && false === this.#record[prop_name]) ||
            (null != this.#record[prop_name] && option_el.value === this.#record[prop_name].toString())
          ){
            option_el.selected = true;
          } else {
            option_el.removeAttribute("selected");
          }
        });
      } else {
        let value = this.get_record_label(prop_name);
        control_el.value = null === value ? "" : value;

        // update textarea sizes
        if ("text" == prop.type) {
          control_el.style.height = "";
          control_el.style.height = control_el.scrollHeight + "px";
        }
      }
    }
  }

  /**
   * ADD DOCS
   */
  create_property_element(prop_name) {
    const module_prop = this.parent_model.module.properties[prop_name];
    const prop = this.#properties[prop_name];
    const prop_el = CN_element.create(`<div name="${prop.id}" class="row mb-3"></div>`);

    // add the label to the property
    prop_el.append(CN_element.create_form_label({ for: prop.id, value: prop.title }));

    if (!prop.placeholder_el) {
      prop.placeholder_el = CN_element.create(`
        <div name="placeholder" class="col-sm-9 placeholder-glow h-100">
          <input class="form-control placeholder" disabled></input>
        </div>
      `);
    }

    if (!prop.element) {
      // determine the property's UI element based on the type
      let params = {
        id: prop.id,
        name: prop_name,
        title: prop.title,
        required: module_prop ? module_prop.required : false,
        placeholder: "(empty)",
      };

      // if this is a typeahead then create a copy of the typeahead object
      if ("typeahead" == prop.type) {
        params.typeahead = { ...prop.typeahead };
      } else {
        const self_obj = this;
        params.onchange = async (control_el, success) => {
          if (success) {
            await self_obj.on_change(prop_name);
          } else {
            control_el.value = self_obj.record[prop_name];
          }
        };
      }

      if (["integer", "float"].includes(prop.type)) {
        params.min = prop.min;
        params.max = prop.max;
      }

      prop.element = CN_element.create_form_element(prop.type, params);
    }

    // add the value UI element to the property
    prop_el.append(prop.element);

    return prop_el;
  }

  /**
   * ADD DOCS
   */
  create_body_element() {
    const form_el = CN_element.create("<form></form>");
    const fieldset_el = CN_element.create("<fieldset></fieldset>");
    fieldset_el.disabled = !this.parent_model.allow_edit();
    form_el.append(fieldset_el);

    for (const prop_name in this.#properties) {
      fieldset_el.append(this.create_property_element(prop_name));
    }

    return form_el;
  }

  /**
   * ADD DOCS
   */
  create_footer_element() {
    const btn_group_el = CN_element.create(`<div class="btn-group" role="group"></div>`);

    const parent_btn_el = CN_element.create(
      '<button name="back" type="button" class="btn btn-primary">Back</button>'
    );
    btn_group_el.append(parent_btn_el);
    (async () => { parent_btn_el.innerHTML = await this.get_text("view_parent"); })();
    parent_btn_el.onclick = async () => await this.on_navigate_to_parent();

    const delete_btn_el = CN_element.create(`
      <button name="delete" type="button" class="btn btn-danger">
        Delete ${CN_common.uc_words(this.parent_model.name.singular)}
      </button>
    `);
    btn_group_el.append(delete_btn_el);
    delete_btn_el.onclick = async () => await this.on_delete();

    return btn_group_el;
  }

  /**
   * ADD DOCS
   */
  render() {
    const el = super.render();

    // add a child list selector
    if (1 < this.parent_model.module.children.length) {
      const list_selector_el = CN_element.create_card();
      el.append(list_selector_el);

      list_selector_el.querySelector(".card-header").append(CN_element.create(`
        <div class="d-flex">
          <div class="flex-grow-1">
            List Selector
          </div>
        </div>
      `));

      list_selector_el.querySelector(".card-body").remove();

      const btn_group_el = CN_element.create(`<div class="row"></div>`);
      list_selector_el.querySelector(".card-footer").append(btn_group_el);

      // add children to the list selector and render them
      this.parent_model.module.children.forEach((child_subject) => {
        const child_module = CN_session.data.modules[child_subject];

        const child_btn_el = CN_element.create(`
          <button name="${child_module.subject}" type="button" class="col btn btn-primary mx-1">
            ${CN_common.uc_words(child_module.model.name.singular)}
          </button>
        `);
        btn_group_el.append(child_btn_el);

        child_btn_el.onclick = async () => {
          this.#tab = child_subject;
          window.history.replaceState(null, null, `?tab=${this.#tab}`);

          this.parent_model.module.children.forEach(c => {
            let cm = CN_session.data.modules[c];
            if (c == child_subject) {
              el.append(cm.model.element);
            } else {
              cm.model.element.remove();
            }
          });
        };

        const child_el = child_module.model.render();
        if (child_subject == (new URL(window.location)).searchParams.get('tab')) {
          el.append(child_el);
        }
      });
    } else if (1 == this.parent_model.module.children.length) {
      // render the only child directly
      el.append(
        CN_session.data.modules[this.parent_model.module.children[0]].model.render()
      );
    }

    return el;
  }

  /**
   * ADD DOCS
   */
  async run(children = false) {
    if (!this.parent_model.module.operation) return;

    await super.run();

    if (children) {
      this.parent_model.module.children.forEach(async (subject) => {
        const module = CN_session.data.modules[subject];
        if (module && "list" == module.operation.action) module.model.run();
      });
    }
  }
}
