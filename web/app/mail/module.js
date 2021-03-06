cenozoApp.defineModule({
  name: "mail",
  optionalDependencies: "trace",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "participant",
          column: "participant.uid",
        },
      },
      name: {
        singular: "email",
        plural: "emails",
        possessive: "email's",
      },
      columnList: {
        uid: {
          column: "participant.uid",
          title: "Participant",
        },
        schedule_datetime: {
          title: "Scheduled Date & Time",
          type: "datetime",
        },
        sent_datetime: {
          title: "Sent Date & Time",
          type: "datetime",
        },
        sent: {
          title: "Sent",
          type: "boolean",
        },
        subject: {
          title: "Subject",
        },
      },
      defaultOrder: {
        column: "schedule_datetime",
        reverse: true,
      },
    });

    module.addInputGroup("", {
      participant_id: {
        column: "mail.participant_id",
        title: "Participant",
        type: "lookup-typeahead",
        typeahead: {
          table: "participant",
          select:
            'CONCAT( participant.first_name, " ", participant.last_name, " (", uid, ")" )',
          where: ["participant.first_name", "participant.last_name", "uid"],
        },
        isConstant: function ($state, model) {
          return (
            "mail" != model.getSubjectFromState() ||
            "view" == model.getActionFromState()
          );
        },
      },
      from_name: {
        title: "From Name",
        type: "string",
        isConstant: function ($state, model) {
          return (
            "view" == model.getActionFromState() &&
            null != model.viewModel.record.sent_datetime
          );
        },
      },
      from_address: {
        title: "From Address",
        type: "string",
        format: "email",
        help: 'Must be in the format "account@domain.name".',
        isConstant: function ($state, model) {
          return (
            "view" == model.getActionFromState() &&
            null != model.viewModel.record.sent_datetime
          );
        },
      },
      to_name: {
        title: "To Name",
        type: "string",
        isConstant: function ($state, model) {
          return (
            "view" == model.getActionFromState() &&
            null != model.viewModel.record.sent_datetime
          );
        },
      },
      to_address: {
        title: "To Address",
        type: "string",
        format: "email",
        help: 'Must be in the format "account@domain.name".',
        isConstant: function ($state, model) {
          return (
            "view" == model.getActionFromState() &&
            null != model.viewModel.record.sent_datetime
          );
        },
      },
      cc_address: {
        title: "Carbon Copy (CC)",
        type: "string",
        help: 'May be a comma-delimited list of email addresses in the format "account@domain.name".',
        isConstant: function ($state, model) {
          return (
            "view" == model.getActionFromState() &&
            null != model.viewModel.record.sent_datetime
          );
        },
      },
      bcc_address: {
        title: "Blind Carbon Copy (BCC)",
        type: "string",
        help: 'May be a comma-delimited list of email addresses in the format "account@domain.name".',
        isConstant: function ($state, model) {
          return (
            "view" == model.getActionFromState() &&
            null != model.viewModel.record.sent_datetime
          );
        },
      },
      schedule_datetime: {
        title: "Scheduled Date & Time",
        type: "datetime",
        min: "now",
        isConstant: function ($state, model) {
          return (
            "view" == model.getActionFromState() &&
            null != model.viewModel.record.sent_datetime
          );
        },
      },
      sent_datetime: {
        title: "Sent Date & Time",
        type: "datetime",
        isExcluded: "add",
        isConstant: true,
      },
      sent: {
        title: "Sent",
        type: "boolean",
        isExcluded: "add",
        isConstant: true,
      },
      subject: {
        title: "Subject",
        type: "string",
        isConstant: function ($state, model) {
          return (
            "view" == model.getActionFromState() &&
            null != model.viewModel.record.sent_datetime
          );
        },
      },
      body: {
        title: "Body",
        type: "text",
        isConstant: function ($state, model) {
          return (
            "view" == model.getActionFromState() &&
            null != model.viewModel.record.sent_datetime
          );
        },
      },
      note: {
        title: "Note",
        type: "text",
        help: "Notes are for internal use only. Participants will not see this note.",
      },
    });

    module.addExtraOperation("view", {
      title: "Preview",
      operation: async function ($state, model) {
        await model.viewModel.preview();
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnMailAddFactory", [
      "CnBaseAddFactory",
      "CnHttpFactory",
      function (CnBaseAddFactory, CnHttpFactory) {
        var object = function (parentModel) {
          CnBaseAddFactory.construct(this, parentModel);

          this.onNew = async function (record) {
            await this.$$onNew(record);

            var parent = this.parentModel.getParentIdentifier();
            var response = await CnHttpFactory.instance({
              path: "application/0",
              data: { select: { column: ["mail_name", "mail_address"] } },
            }).get();

            record.from_name = response.data.mail_name;
            record.from_address = response.data.mail_address;

            var response = await CnHttpFactory.instance({
              path: parent.subject + "/" + parent.identifier,
              data: {
                select: {
                  column: [
                    "honorific",
                    "first_name",
                    "other_name",
                    "last_name",
                    "email",
                  ],
                },
              },
            }).get();

            record.to_name =
              response.data.honorific + " " + response.data.first_name;
            if (response.data.other_name)
              record.to_name += " (" + response.data.other_name + ")";
            record.to_name += " " + response.data.last_name;
            record.to_address = response.data.email;
          };
        };
        return {
          instance: function (parentModel) {
            return new object(parentModel);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnMailViewFactory", [
      "CnBaseViewFactory",
      "CnHttpFactory",
      "CnModalMessageFactory",
      function (CnBaseViewFactory, CnHttpFactory, CnModalMessageFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root);

          this.preview = async function () {
            var response = await CnHttpFactory.instance({
              path: "application/0",
              data: { select: { column: ["mail_header", "mail_footer"] } },
            }).get();

            var body = this.record.body;
            if (null != response.data.mail_header) {
              // if the header has html but the body doesn't then convert line breaks to <br>s
              if (
                response.data.mail_header.match(/<html>/) &&
                !body.match(/<[^>]+>/)
              )
                body = body.replace(/\r?\n/g, "<br/>$&");
              body = response.data.mail_header + "\n" + body;
            }

            if (null != response.data.mail_footer)
              body = body + "\n" + response.data.mail_footer;
            await CnModalMessageFactory.instance({
              title: "Mail Preview",
              message: body,
              html: null != body.match(/<html>/),
            }).show();
          };
        };
        return {
          instance: function (parentModel, root) {
            return new object(parentModel, root);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnMailModelFactory", [
      "CnBaseModelFactory",
      "CnMailListFactory",
      "CnMailAddFactory",
      "CnMailViewFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnMailListFactory,
        CnMailAddFactory,
        CnMailViewFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnMailAddFactory.instance(this);
          this.listModel = CnMailListFactory.instance(this);
          this.viewModel = CnMailViewFactory.instance(this, root);

          // only allow mail to be deleted if it hasn't been sent
          this.getDeleteEnabled = function () {
            return (
              this.$$getDeleteEnabled() &&
              "mail" == this.getSubjectFromState() &&
              "view" == this.getActionFromState() &&
              null == this.viewModel.record.sent_datetime
            );
          };
        };

        return {
          root: new object(true),
          instance: function () {
            return new object(false);
          },
        };
      },
    ]);
  },
});
