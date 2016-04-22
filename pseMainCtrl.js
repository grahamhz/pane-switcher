angular.module('pane-switcher-example').controller('pseMainCtrl', ['$rootScope', '$scope',
    function($rootScope, $scope) {
        $scope.paneSwitcherCtrl = {};
        $scope.paneSwitcherConfig = {
            widthWatchers: [
                '$root.isMobile',
                '$root.showSideMenu'
            ]
        };

        $scope.push_it = function () {
            var attrs = [
                {key: "class", value: "some-class-I-dunno"}
            ];

            var popup = {
                elementId: 'cool-popup',
                title: 'This is a title!',
                confirmButtonText: 'I Concur',
                cancelButtonText: 'Meh',
                confirmButtonClass: 'css-class-for-confirm-button',
                cancelButtonClass: 'css-class-for-cancel-button',
                confirmButtonCallback: function () {
                    confirm();
                },
                cancelButtonCallback: function () {
                    cancel();
                }
            }
            $scope.paneSwitcherCtrl.push_popup('totally-cool-popup', attrs, popup);
        };

        function confirm()
        {
            $scope.paneSwitcherCtrl.pop_popup();
        }

        function cancel()
        {
            $scope.paneSwitcherCtrl.pop_popup();
        }
    }
]);