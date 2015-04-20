<div class="span-drawers">
  <div class="snap-drawer snap-drawer-left" ng-controller="CnMenuCtrl">
    <accordion close-others="true">
      <accordion-group ng-init="isOpen = true" is-open="isOpen">
        <accordion-heading>
          <button class="btn btn-primary btn-accordion full-width">Lists</button>
        </accordion-heading>
        <div class="btn-group-vertical full-width" role="group">
          <a class="btn btn-default"
             ng-repeat="(subject,item) in lists"
             ng-class="{ 'btn-info': isCurrentState( subject ) }"
             ui-sref="{{ subject }}.list"
             snap-close>{{ item.title }}</a>
        </div>
      </accordion-group>
      <accordion-group>
        <accordion-heading>
          <button class="btn btn-primary btn-accordion full-width">Utilities</button>
        </accordion-heading>
        <div class="btn-group-vertical full-width" role="group">
          <a class="btn btn-default"
             ng-repeat="(subject,item) in utilities"
             ng-class="{ 'btn-info': isCurrentState( subject ) }"
             ui-sref="{{ subject }}"
             snap-close>{{ item.title }}</a>
        </div>
      </accordion-group>
      <accordion-group>
        <accordion-heading>
          <button class="btn btn-primary btn-accordion full-width">Report</button>
        </accordion-heading>
        <div class="btn-group-vertical full-width" role="group">
          <a class="btn btn-default"
             ng-repeat="(subject,item) in reports"
             ng-class="{ 'btn-info': isCurrentState( subject ) }"
             ui-sref="{{ subject }}"
             snap-close>{{ item.title }}</a>
        </div>
      </accordion-group>
    </accordion>
  </div>
</div>

<snap-content snap-opt-tap-to-close="true" snap-opt-disable="'right'" snap-opt-hyperextensible="false">
  <button snap-toggle="left" class="btn btn-primary menu-button rounded-right">
    <i class="glyphicon glyphicon-align-justify" aria-hidden="true"></i>
  </button>
  <div snap-dragger class="container-fluid bg-info body-heading">
    <div class="row">
      <div class="col-xs-3 body-heading-title">
        <cn-application-title></cn-application-title>
      </div>
      <div class="col-xs-5 body-heading-shortcuts">
        <cn-clock></cn-clock>
        <cn-toolbelt></cn-toolbelt>
      </div>
      <div class="col-xs-4 body-heading-state">
        <cn-site-role-switcher></cn-site-role-switcher>
      </div>
    </div>
  </div>
  <div class="body-view">
    <div ui-view class="container-fluid view-frame"></div>
  </div>
</snap-content>
