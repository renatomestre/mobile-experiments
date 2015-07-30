var app = angular.module('app', [
    'ui.router',
    'ngCookies',
    'home',
    'abrirReclamacao',
    'user',
    'signIn',
    'ui.mask',
    'cadastro'
]);



app.config(['$urlRouterProvider', '$locationProvider', '$httpProvider', '$stateProvider', function ($urlRouterProvider, $locationProvider, $httpProvider, $stateProvider) {

    //================================================
    // Add an interceptor for AJAX errors
    //================================================
    $httpProvider.responseInterceptors.push(['$q', '$location', function ($q, $location) {
        return function (promise) {
            return promise.then(
              // Success: just return the response
              function (response) {
                  return response;
              },
              // Error: check the error status to get only the 401
              function (response) {
                  if (response.status === 401)
                      $location.url('/');
                  return $q.reject(response);
              }
            );
        }
    }]);


    //================================================
    // Routes
    //================================================
    $urlRouterProvider.otherwise("/Home/Solicitacao");

    //$stateProvider.state('AbrirReclamacao', {
    //    url: "/AbrirReclamacao",
    //    templateUrl: "Views/AbrirReclamacao/Home.html"
    //});

}]);
app.filter('formatCpf', [
    '$filter', function($filter) {
        return function (input, format) {
            try {
                var cpf = input.toString().substring(0, 3) + '.' + input.toString().substring(3, 6) + '.' + input.toString().substring(6, 9) + '-' + input.toString().substring(9, 11);
                return cpf;
            } catch(e) {
                return '---';
            }
        };
    }
])
app.run(['$http', '$cookies', '$cookieStore', '$rootScope', '$state', function ($http, $cookies, $cookieStore, $rootScope, $state) {

    $rootScope.registerAccess = function (user) {
        $rootScope.user = user;
        $rootScope.username = '';
        $rootScope.password = '';
    };

    $rootScope.logout = function () {
        $rootScope.user.name = '';
        $rootScope.user.cpf = '';
        $rootScope.user.isAuthenticated = false;
        $rootScope.username = '';
        $rootScope.password = '';

        $http.defaults.headers.common.Authorization = null;
        $http.defaults.headers.common.RefreshToken = null;
        $cookieStore.remove('_Token');

        window.location = '#/';
    };
    $rootScope.showLogin = true;
    $rootScope.signIn = function () {

        var params = "grant_type=password&username=" + $rootScope.username.replace('-', '').replace(/\./g, '') + "&password=" + $rootScope.password;
        $http({
            url: "http://www.sorocaba.sp.gov.br/156sorocaba/api/auth/token",
            method: "POST",
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: params
        })
        .success(function (data, status, headers, config) {
            $http.defaults.headers.common.Authorization = "Bearer " + data.access_token;
            $http.defaults.headers.common.RefreshToken = data.refresh_token;


            $cookieStore.put("_Token", data.access_token);


            $.ajax({
                type: "POST",
                async: false,
                dataType: 'json',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + $cookieStore.get('_Token'));
                },
                url: "http://www.sorocaba.sp.gov.br/156sorocaba/api/users/current",
                success: function (data) {
                    $rootScope.registerAccess({
                        id: data.users.id,
                        cpf: data.users.taxNumber,
                        isAuthenticated: true,
                        name: data.users.name,
                        idCRM: data.users.idcrm
                    });

                    $('#loginModal').foundation('reveal', 'close');
                    $state.go('User.Requests', null, {
                        reload: true
                    });
                }
            });

            
        })
        .error(function (data, status, headers, config) {
            if (data.error_description)
                alert(data.error_description.replace(/["']{1}/gi, ""));
        });
    }

    $rootScope.enviarNovaSenha = function () {

        $rootScope.Tentativas++;

        if ($rootScope.Tentativas > 1) {
            return;
        }

        var data = {
            TaxNumber: $rootScope.EsqueciMinhaSenha.Cpf,
            Email: $rootScope.EsqueciMinhaSenha.Email
        };

        $http.post("http://www.sorocaba.sp.gov.br/156sorocaba/api/users/reset_password", data)
            .success(function (data) {
                $rootScope.Tentativas = 0;
                $rootScope.showLoginModel();
                alert('Foi enviado um email contendo as instruções para utilizar a nova senha gerada.');
            })
            .error(function (data, status, headers, config) {
                $rootScope.Tentativas = 0;
            });
        
    }

    $rootScope.showLoginModel = function () {
        $rootScope.username = '';
        $rootScope.password = '';
        $rootScope.showLogin = true;
    }

    $rootScope.showEsqueciSenhaModel = function () {
        $rootScope.username = '';
        $rootScope.password = '';
        $rootScope.showLogin = false;
    }

    $rootScope.$on('$locationChangeSuccess', function (event) {

        var params = "grant_type=refresh_token&refresh_token=" + $http.defaults.headers.common.RefreshToken;
        //$http({
        //    url: '/Token',
        //    method: "POST",
        //    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        //    data: params
        //})
        //.success(function (data, status, headers, config) {
        //    $http.defaults.headers.common.Authorization = "Bearer " + data.access_token;
        //    $http.defaults.headers.common.RefreshToken = data.refresh_token;

        //    $cookieStore.put('_Token', data.access_token);
        //    $cookieStore.put('_RefreshToken', data.refresh_token);

        //    $http.get('http://www.sorocaba.sp.gov.br/156sorocaba/api/WS_Account/GetCurrentUserName')
        //        .success(function (data, status, headers, config) {
        //            if (data != "null")
        //            {
        //                $rootScope.username = data.replace(/["']{1}/gi, "");//Remove any quotes from the username before pushing it out.
        //                $rootScope.loggedIn = true;
        //            }
        //            else
        //                $rootScope.loggedIn = false;
        //        });


        //})
        //.error(function (data, status, headers, config) {
        //    $rootScope.loggedIn = false;
        //});
    });

    setTimeout(function () { $('#logo').focus(); }, 3500);

    //If a token exists in the cookie, load it after the app is loaded, so that the application can maintain the authenticated state.
    $http.defaults.headers.common.Authorization = 'Bearer ' + $cookieStore.get('_Token');
    $http.defaults.headers.common.RefreshToken = $cookieStore.get('_RefreshToken');

    $rootScope.user = {
        id: '',
        name: '',
        cpf: '',
        token: '',
        isAuthenticated: false
    };

    if ($cookieStore.get('_Token') != undefined && $cookieStore.get('_Token') != "") {

        $.ajax({
            type: "POST",
            async: false,
            dataType: 'json',
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Bearer " + $cookieStore.get('_Token'));
            },
            url: "http://www.sorocaba.sp.gov.br/156sorocaba/api/users/current",
            success: function(data) {
                $rootScope.registerAccess({
                    id: data.users.id,
                    cpf: data.users.taxNumber,
                    isAuthenticated: true,
                    name: data.users.name,
                    idCRM: data.users.idcrm
                });
            }
        });

    }
}]);



