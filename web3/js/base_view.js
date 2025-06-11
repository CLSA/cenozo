import CN_api from "./api.js"
import CN_common from "./common.js"
import CN_element from "./element.js"
import CN_event from "./event.js"
import CN_session from "./session.js"

import { CN_base_record } from "./base_record.js"

export class CN_base_view extends CN_base_record {
  #tab = null;

  /**
   * ADD DOCS
   */
  get_text(type) {
    if ("name" == type) {
      return (
        this.properties.hasOwnProperty("name") ? this.get_state("name") :
        this.properties.hasOwnProperty("title") ? this.get_state("title") :
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
    await super.on_load();

    // load the record
    const response = await CN_api.get(
      `${this.parent_model.module.subject}/${this.parent_model.module.operation.identifier}`
    );

    const record = await response.json();
    for (var prop_name in this.properties) {
      const prop = this.properties[prop_name];
      // check for the formatted value for this property
      if ("typeahead" == prop.type && record.hasOwnProperty(`formatted_${prop.name}`)) {
        this.clear_state(prop.name);
        this.set_state(prop.name, record[`formatted_${prop.name}`]);
        this.commit_state(prop.name);
      } else if (record.hasOwnProperty(prop.name)) {
        this.clear_state(prop.name);
        this.set_state(prop.name, record[prop.name]);
        this.commit_state(prop.name);
      }
    }
  }

  /**
   * ADD DOCS
   */
  show_placeholder() {
    super.show_placeholder();

    // Replace the property elements with placeholders
    for (const prop_name in this.properties) {
      const prop = this.properties[prop_name];
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
    for (const prop_name in this.properties) {
      const prop = this.properties[prop_name];
      const prop_el = this.element.querySelector(`[name=${prop.id}]`);
      if (prop.element) {
        prop_el.replaceChild(prop.element, prop_el.querySelector("[name=placeholder]"));
      }
    }
  }

  async on_set_property(prop_name) {
    const prop = this.properties[prop_name];
    const control_el = document.getElementById(prop.id);

    try {
      // update the server
      let data = {};
      data[prop.name] = this.get_state(prop.name);
      if ("boolean" == prop.type) {
        data[prop.name] = "" == data[prop.name] ? null : Number(data[prop.name]);
      } else if ("date" == prop.type) {
        if ("" == data[prop.name]) data[prop.name] = null;
      } else if ("typeahead" == prop.type) {
        // convert from value to key by looking up the element's typeahead list in the params object
        // NOTE: the element's params is not the same as the property's params object (it is cloned)
        data[prop.name] = prop.element.params.typeahead.list.find(item => data[prop.name] === item.value).key;
      }

      await CN_api.patch(
        `${this.parent_model.module.subject}/${this.parent_model.module.operation.identifier}`,
        data
      );
    } catch (error) {
      this.undo_state(prop.name);
      if ("Conflict (409)" == error.name) {
        JSON.parse(error.body).forEach(prop_name => {
          const prop = this.properties[prop_name];
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
  update_property_element(prop_name) {
    const module_prop = this.parent_model.module.properties[prop_name];
    const prop = this.properties[prop_name];
    const control_el = document.getElementById(prop.id);

    // rebuild enum select options
    if (["boolean", "enum", "rank"].includes(prop.type)) {
      if ("boolean" != prop.type) {
        control_el.innerHTML = module_prop && module_prop.required ? "" : `<option value="">(empty)</option>`;
        prop.enum.values.forEach(option => {
          control_el.append(CN_element.create(`
            <option value="${option.key}">${option.value}</option>
          `));
        });
      }

      control_el.querySelectorAll("option").forEach(option_el => {
        const value = this.get_state(prop.name);
        if (
          ("" == option_el.value && null === value) ||
          (1 == option_el.value && true === value) ||
          (0 == option_el.value && false === value) ||
          (null != value && option_el.value === value.toString())
        ){
          option_el.selected = true;
        } else {
          option_el.removeAttribute("selected");
        }
      });
    } else {
      let value = this.get_state(prop.name);
      control_el.value = null === value ? "" : value;

      // update textarea sizes
      if ("text" == prop.type) {
        control_el.style.height = "";
        control_el.style.height = control_el.scrollHeight + "px";
      }
    }

    // flash the border green to show the data has been updated
    const old_style = control_el.style;
    control_el.style["border-color"] = "green";
    setTimeout(() => { control_el.style = old_style; }, 500);
  }

  /**
   * ADD DOCS
   */
  create_property_element(prop_name) {
    const prop = this.properties[prop_name];
    const prop_el = super.create_property_element(prop_name);

    if (!prop.placeholder_el) {
      prop.placeholder_el = CN_element.create(`
        <div name="placeholder" class="col-sm-9 placeholder-glow h-100">
          <input class="form-control placeholder" disabled></input>
        </div>
      `);
    }

    return prop_el;
  }

  /**
   * ADD DOCS
   */
  create_body_element() {
    const form_el = super.create_body_element();
    form_el.querySelector("fieldset").disabled = !this.parent_model.allow_edit();
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
