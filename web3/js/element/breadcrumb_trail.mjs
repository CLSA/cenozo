import { CN_base_element } from "./base_element.mjs"
import { CN_api } from "../api.mjs"
import { CN_common } from "../common.mjs"
import { CN_session } from "../session.mjs"

export class CN_element_breadcrumb_trail extends CN_base_element {
  constructor(parent_el, config = {}) {
    if (!CN_common.is_object(config)) {
      throw new Error("Non-object config argument passed to CN_element_breadcrumb_trail constructor");
    }

    super(parent_el, {
      ...{
        loading: false,
        crumb_list: [],
      },
      ...config
    });
  }

  /**
   * Extend parent method
   */
  update_element() {
    const el = this.get_element();
    let crumb_list = CN_common.clone(this.get_config("crumb_list"));

    el.innerHTML = "";
    if (this.get_config("loading")) {
      // when there are no crumbs show the loading indicator
      crumb_list = [{ name: "Loading...", path: null }];
    } else {
      // add the home crumb at the start
      el.append(this.constructor.html('<i class="bi bi-chevron-compact-right text-light"></i>'));
      const home_crumb_el = this.constructor.html(`
        <button
          type="button"
          name="home"
          class="btn btn-primary px-1"
          data-bs-dismiss="offcanvas"
          data-bs-target="#main-menu-offcanvas"
        >Home</button>
      `);
      el.append(home_crumb_el);
      home_crumb_el.addEventListener("click", () => CN_session.navigate_to(""));

      (async () => {
        const response = await CN_api.count("self/0/system_message", {
          no_activity: 1,
          modifier: { where: { column: "user_id", operator: "=", value: null } },
        });

        home_crumb_el.innerHTML = (
          0 < response ?
          'Home <i class="bi bi-envelope-fill text-warning"></i>' :
          "Home"
        );
      })();
    }

    // add each crumb to the trail, interspersed by chevrons
    let last_crumb_el = null;
    crumb_list.forEach(crumb => {
      el.append(this.constructor.html('<i class="bi bi-chevron-compact-right text-light"></i>'));
      const crumb_el = this.constructor.html(`
        <button
          type="button"
          class="btn btn-primary px-1"
          data-bs-dismiss="offcanvas"
          data-bs-target="#main-menu-offcanvas"
        >${crumb.name}</button>
      `);
      last_crumb_el = crumb_el;
      el.append(crumb_el);
      if (null == crumb.path) {
        this.constructor.set_disabled(crumb_el, true);
      } else {
        crumb_el.addEventListener("click", () => CN_session.navigate_to(crumb.path));
      }
    });

    // the last crumb shuold always be disabled
    if (last_crumb_el) this.constructor.set_disabled(last_crumb_el, true);
  }
}
