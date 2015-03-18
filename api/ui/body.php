<div class="span-drawers">
  <div class="snap-drawer snap-drawer-left" ng-controller="CnMenuCtrl">
    <accordion close-others="true">
      <accordion-group ng-init="isOpen = true" is-open="isOpen">
        <accordion-heading>
          <button class="btn btn-primary btn-accordion full-width">Lists</button>
        </accordion-heading>
        <div class="btn-group-vertical full-width" role="group">
          <a class="btn btn-default"
             ng-repeat="item in lists"
             ng-class="{ 'btn-info': isCurrentState( item.sref ) }"
             ui-sref="{{ item.sref }}"
             snap-close>{{ item.title }}</a>
        </div>
      </accordion-group>
      <accordion-group>
        <accordion-heading>
          <button class="btn btn-primary btn-accordion full-width">Utilities</button>
        </accordion-heading>
        <div class="btn-group-vertical full-width" role="group">
          <a class="btn btn-default"
             ng-repeat="item in utilities"
             ng-class="{ 'btn-info': isCurrentState( item.sref ) }"
             ui-sref="{{ item.sref }}"
             snap-close>{{ item.title }}</a>
        </div>
      </accordion-group>
      <accordion-group>
        <accordion-heading>
          <button class="btn btn-primary btn-accordion full-width">Report</button>
        </accordion-heading>
        <div class="btn-group-vertical full-width" role="group">
          <a class="btn btn-default"
             ng-repeat="item in reports"
             ng-class="{ 'btn-info': isCurrentState( item.sref ) }"
             ui-sref="{{ item.sref }}"
             snap-close>{{ item.title }}</a>
        </div>
      </accordion-group>
    </accordion>
  </div>
</div>

<snap-content snap-opt-tap-to-close="true" snap-opt-min-drag-distance="10000">
  <button snap-toggle="left" class="btn btn-primary menu-button rounded-top">
    <i class="glyphicon glyphicon-align-justify" aria-hidden="true"></i>
  </button>
  <div class="container-fluid bg-info body-heading">
    <div class="row">
      <div class="col-xs-3 body-heading-title">
        <cn-application-title></cn-application-title>
      </div>
      <div class="col-xs-5 body-heading-shortcuts">
        <i class="glyphicon glyphicon-time" aria-hidden="true"></i>
        <cn-clock></cn-clock>
        <div class="btn-group">
          <button class="btn btn-default" tooltip="Edit Profile" tooltip-placement="bottom">
            <i class="glyphicon glyphicon-edit" aria-hidden="true"></i>
          </button>
          <button class="btn btn-default" tooltip="Logout" tooltip-placement="bottom">
            <i class="glyphicon glyphicon-off" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <div class="col-xs-4 body-heading-state">
        <cn-site-role-picker></cn-site-role-picker>
      </div>
    </div>
  </div>
  <div class="body-view">
    <div ui-view class="container-fluid view-frame"></div>
  </div>
</snap-content>
