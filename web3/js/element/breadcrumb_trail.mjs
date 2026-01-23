  /**
   * Creates a breadcrumb trail based on a model list
   * @param [model] model_list: A list of models in their trail order
   * @return Element
   */
  create_breadcrumb_trail: async function (base_name, model_list = []) {
    // create a list of all crumbs (adding chevrons later)
    const crumb_list = [];

    if ([null, "Error"].includes(base_name)) {
      const unread = 0 == CN_session.system_message_list.filter(message => message.unread).length;
      crumb_list.push({
        name: unread ? "Home" : 'Home <i class="bi-envelope-fill text-warning"></i>',
        path: ""
      });
    }

    if (null != base_name) crumb_list.push({ name: base_name, path: null });

    // run all get_text() async calls in parallel
    await Promise.all(model_list.map(model => (async () => {
      let crumb = { name: "...", path: "view" == model.get_action_name() ? model.get_view_url() : null };
      crumb_list.push(crumb);

      // get the name after we've added the crumb to the list, otherwise it may be out of order
      crumb.name = await model.get_action().get_text("crumb");
    })()));

    // add each crumb to the trail, interspersed by chevrons
    const root_el = this.create("<div></div>");
    let last_crumb_el = null;
    crumb_list.forEach(crumb => {
      root_el.append(this.create('<i class="bi-chevron-compact-right text-light"></i>'));
      let crumb_el = this.create(`
        <button
          class="btn btn-primary px-1"
          data-bs-dismiss="offcanvas"
          data-bs-target="#main-menu-offcanvas"
        >${crumb.name}</button>
      `);
      last_crumb_el = crumb_el;
      root_el.append(crumb_el);
      if (null == crumb.path) {
        crumb_el.setAttribute("disabled", true);
      } else {
        crumb_el.addEventListener("click", CN_session.navigate_to.bind(CN_session, crumb.path));
      }
    });

    // the last crumb shuold always be disabled
    if (last_crumb_el) last_crumb_el.setAttribute("disabled", true);

    return root_el;
  },
