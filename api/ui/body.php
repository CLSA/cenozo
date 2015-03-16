<div class="span-drawers">
  <div class="snap-drawer snap-drawer-left" ng-controller="StMenuCtrl">
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
    </accordian>
  </div>
  <div class="snap-drawer snap-drawer-right">
    This is where the settings content will go
  </div>
</div>

<snap-content snap-opt-tap-to-close="true" snap-opt-min-drag-distance="10000">
  <button snap-toggle="left" class="btn btn-primary menu-button rounded-top">Menu</button>
  <button snap-toggle="right" class="btn btn-primary settings-button rounded-top">Settings</button>
  <div class="container outer-container" data-snap-ignore="true">
    <div ui-view class="container view-frame"></div>
  </div>
</snap-content>
