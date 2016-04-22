(function() {

    angular.module('pane-switcher-example', ['ngRoute'])

        .config(function($routeProvider)
        {
            $routeProvider
                .when('/', { templateUrl: 'mainTemplate.html', controller: 'pseMainCtrl' })
                .otherwise({ redirectTo: '/' });
        })

        .run(['$rootScope', '$window', function($rootScope, $window)
        {
            /**
             * Optionally Set up listeners for mobile screen resolutions
             */
            if($(window).width() < 768)
            {
                $rootScope.isMobile = true;
            }
            else
            {
                $rootScope.isMobile = false;
            }

            $(window).resize(function()
            {
                if($(window).width() < 768)
                {
                    $rootScope.isMobile = true;
                }
                else
                {
                    $rootScope.isMobile = false;
                }
                $rootScope.$apply();
            });

        }]);
})();