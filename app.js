(function() {

    angular.module('pane-switcher-example', ['ngRoute'])

        .config(function($routeProvider, $locationProvider, $compileProvider)
        {
            $routeProvider
                .when('/', { templateUrl: 'main.html', controller: 'pseMainCtrl' })
                .otherwise({ redirectTo: '/' });
        })

        .run(['$rootScope', '$window', function($rootScope, $window)
        {
            /**
             * Set up listeners for mobile screen resolutions
             */
            if($window.width() < 768)
            {
                $rootScope.isMobile = true;
            }
            else
            {
                $rootScope.isMobile = false;
            }

            $window.resize(function()
            {
                if($window.width() < 768)
                {
                    $rootScope.isMobile = true;
                }
                else
                {
                    $rootScope.isMobile = false;
                }
                $rootScope.$apply();
            });

            /**
             * Helper functions
             */
            String.prototype.toUnderscore = function()
            {
                return this.replace(/([A-Z])/g, function($1) { return "_"+ $1.toLowerCase(); });
            };

            String.prototype.toCamel = function()
            {
                return this.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
            };
        }]);
})();