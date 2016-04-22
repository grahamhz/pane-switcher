angular.module('pane-switcher-example').directive('totallyCoolPopup', [
    function()
    {
        var totallyCoolPopupDirective = {
            restrict: 'E',
            replace: true,
            templateUrl: 'totallyCoolPopup.html'
        };

        totallyCoolPopupDirective.scope = {
            data: '='
        };

        totallyCoolPopupDirective.link = function ($scope, $element, attr, ctrl)
        {

        };

        return totallyCoolPopupDirective;
    }
]);