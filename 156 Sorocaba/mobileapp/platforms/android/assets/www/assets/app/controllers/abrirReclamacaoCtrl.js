angular.module('abrirReclamacao', [
    'ui.router',
    'ngCookies',
    'mm.foundation',
    'cadastro'
])
    .factory('Data', function () {
        return {
            GrupoServico: "",
            TipoServico: "",
            Assunto: "",
            DescricaoDetalhada: "",
            TermoDeResponsabilidade: false,
            Localizacao: {
                CEP: "",
                Municipio: "",
                Logradouro: "",
                Numero: "",
                Complemento: "",
                Bairro: "",
                Referencia: ""
            }
        };
    })
    .config(['$urlRouterProvider', '$stateProvider', function ($urlRouterProvider, $stateProvider) {

        //================================================
        // Routes
        //================================================
        $stateProvider
            .state('AbrirReclamacao', {
                abstract: true,
                url: "/AbrirReclamacao",
                templateUrl: "Views/AbrirReclamacao/Home.html",
                controller: ['$scope', '$http', 'Data', function ($scope, $http, $Data) {
                    var request = window.sessionStorage['Reclamacao'];
                    if(request)
                        $Data = JSON.parse(request);

                    $scope.Solicitacao = $Data;
                }]
            })
            .state('AbrirReclamacao.Login', {
                url: "/Login",
                templateUrl: "Views/AbrirReclamacao/Login.html",
                controller: 'loginCtrl'
            })
            .state('AbrirReclamacao.DadosGerais', {
                url: "",
                templateUrl: "Views/AbrirReclamacao/DadosGerais.html",
                controller: 'dadosGeraisSolicCtrl'
            })
            .state('AbrirReclamacao.Localizacao', {
                url: "/Localizacao",
                templateUrl: "Views/AbrirReclamacao/Localizacao.html",
                controller: 'localizacaoCtrl'
            })
            .state('AbrirReclamacao.Revisao', {
                url: "/Revisao",
                templateUrl: "Views/AbrirReclamacao/Revisao.html",
                controller: 'revisaoCtrl'
            });


    }])
    .filter('ifnull', [
    '$filter', function ($filter) {
        return function (input, format) {
            debugger;
            return input == undefined || input == '' ? format : input;
        };
    }
    ])
    .directive('ngValidabide',['$parse', '$rootScope',  function ($parse, $rootScope) {
        return {
            restrict: 'A',
            //scope: { 'ngValidabide': '=' },
            link: function (scope, element, attrs) {
                var fn = $parse($(element).attr['ng-validabide'], /* interceptorFn */ null, /* expensiveChecks */ true);
                $(element).on('valid', function () {
                    var callback = function () {
                        fn(scope, {
                            $event: $(element).attr('ng-validabide')
                        });
                    };
                    scope.$apply($(element).attr('ng-validabide'));
                });
            }
        }
    }])
    .controller('loginCtrl', ['$scope', '$http', 'Data', '$state', '$cookieStore', '$rootScope', 'CadastroData', function ($scope, $http, $Data, $state, $cookieStore, $rootScope, $CadastroData) {
        $scope.Tentativas = 0;
        var request = window.sessionStorage['Reclamacao'];
        if (request)
            $Data = JSON.parse(request);

        if ($Data.Assunto == "") {
            $state.go('Home.Solicitacao', $Data, {
                reload: true
            });
            return;
        }
        
        $scope.Solicitacao = $Data;
        $scope.username = "";
        $scope.password = "";
        $scope.entrar = function () {
            var params = "grant_type=password&username=" + $scope.username.replace('-', '').replace(/\./g, '') + "&password=" + $scope.password;
            $http({
                url: "http://www.sorocaba.sp.gov.br/156sorocaba/api/auth/token",
                method: "POST",
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: params
            })
            .success(function (data, status, headers, config) {
                $http.defaults.headers.common.Authorization = "Bearer " + data.access_token;
                $http.defaults.headers.common.RefreshToken = data.refresh_token;

                $rootScope.registerAccess({
                    cpf: $scope.username,
                    isAuthenticated: true,
                    name: data.name
                });

                $cookieStore.put("_Token", data.access_token);
                $state.go('AbrirReclamacao.DadosGerais', $Data, {
                    reload: true
                });
            })
            .error(function (data, status, headers, config) {
                alert(data.error_description.replace(/["']{1}/gi, ""));
            });
        };
        $scope.validarCPFEmail = function () {
            $scope.Tentativas++;

            if ($scope.Tentativas > 1) {
                return;
            }

            $http({
                method: 'GET',
                url: 'http://www.sorocaba.sp.gov.br/156sorocaba/api/Contacts/ExisteUsuario?cpf=' + $scope.cpfCadastro + '&email=' + $scope.email
            }).success(function (result) {
                $scope.Tentativas = 0;
                if (result === 'true') {
                    alert('Já existe um cadastro com esse CPF e/ou Email. Utilize o formulário ao lado para se logar ou solicitar uma nova senha.');
                    return;
                } else {
                    $CadastroData.NomeCompleto = '';
                    $CadastroData.Senha = '';
                    $CadastroData.ConfirmaSenha = '';
                    $CadastroData.Localizacao = {
                        CEP: "",
                        Municipio: "",
                        Logradouro: "",
                        Numero: "",
                        Complemento: "",
                        Bairro: "",
                        Referencia: ""
                    }
                    $CadastroData.Email = $scope.email;
                    $CadastroData.CPF = $scope.cpfCadastro;
                    $state.go('Cadastro.DadosGerais', { origem: 2 }, {
                        reload: true
                    });
                    //return;
                }
                
            })
            .error(function (data, status, headers, config) {
                $scope.Tentativas = 0;
            });
        }

        $(document)
         .foundation({
             abide: {
                 patterns: {
                     cpf: /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/
                 }
             }
         });

        if ($rootScope.user.isAuthenticated) {
            $state.go('AbrirReclamacao.DadosGerais', $Data, {
                reload: true
            });
        }

    }])
    .controller('dadosGeraisSolicCtrl', ['$scope', '$http', 'Data', '$state', '$rootScope', '$window', function ($scope, $http, $Data, $state, $rootScope, $window) {
        if (!$rootScope.user.isAuthenticated) {
            $state.go('AbrirReclamacao.Login', $Data, {
                reload: true
            });
        }

        var request = window.sessionStorage['Reclamacao'];
        if (request)
            $Data = JSON.parse(request);

        if ($Data.Assunto == "") {
            $state.go('Home.Solicitacao', $Data, {
                reload: true
            });
            return;
        }

        $scope.Solicitacao = $Data;
        $scope.DescricaoDetalhada = $Data.DescricaoDetalhada;

        $scope.prosseguir = function () {
            $Data.DescricaoDetalhada = $scope.DescricaoDetalhada;

            $window.sessionStorage.setItem("Reclamacao", JSON.stringify($Data));
            
            $state.go('AbrirReclamacao.Localizacao', $Data, {
                reload: true
            });
        };

        $scope.irPara = function (state) {
            $state.go('AbrirReclamacao.' + state, $Data, {
                reload: true
            });
        };

        $('#dadosGeraisSolicForm')
         .foundation({
             abide: {
                 patterns: {
                     cpf: /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/
                 }
             }
         });
    }])
    .controller('localizacaoCtrl', ['$scope', '$http', 'Data', '$state', '$rootScope', '$window', function ($scope, $http, $Data, $state, $rootScope, $window) {
        if (!$rootScope.user.isAuthenticated) {
            $state.go('AbrirReclamacao.Login', $Data, {
                reload: true
            });
            return;
        }

        var request = window.sessionStorage['Reclamacao'];
        if (request)
            $Data = JSON.parse(request);

        if ($Data.Assunto == "") {
            $state.go('Home.Solicitacao', $Data, {
                reload: true
            });
            return;
        }

        $scope.Enderecos = [];

        if ($Data.Localizacao) {
            $scope.CEP = $Data.Localizacao.CEP;
            $scope.Municipio = $Data.Localizacao.Municipio;
            $scope.Logradouro = $Data.Localizacao.Logradouro;
            $scope.Numero = $Data.Localizacao.Numero;
            $scope.Complemento = $Data.Localizacao.Complemento;
            $scope.Bairro = $Data.Localizacao.Bairro;
            $scope.Referencia = $Data.Localizacao.Referencia;
        }

        $scope.CarregarEnderecos = function () {
            $http({
                method: 'GET',
                url: 'http://www.sorocaba.sp.gov.br/156sorocaba/api/Contacts/enderecos'
            }).success(function (result) {
                $scope.Enderecos = result.addresses;

                $scope.Enderecos.unshift({
                    nomeTipoEndereco: '-- Selecione um endereço já cadastrado ou informe um novo --'
                });
            });
        };

        $scope.combined = function (endereco) {
            return endereco.nomeTipoEndereco;
            if (endereco.nome == undefined || endereco.nome == '') {
                return endereco.nomeTipoEndereco;
            }
            else {
                return endereco.nome;
            }
        }

        $scope.CarregarEndereco = function () {
            $("form div").removeClass("error");
            $("form label").removeClass("error");

            $scope.Logradouro = $scope.EnderecoSelecionado.street;

            $scope.CEP = $scope.EnderecoSelecionado.postalCode;
            $scope.Municipio = $scope.EnderecoSelecionado.city;
            $scope.Numero = $scope.EnderecoSelecionado.number;
            $scope.Complemento = $scope.EnderecoSelecionado.additionalInformation;
            $scope.Bairro = $scope.EnderecoSelecionado.district;
            $scope.Referencia = $scope.EnderecoSelecionado.pontoReferencia;
        };

        $scope.carregarCep = function () {
            $http({
                method: 'GET',
                url: 'http://www.sorocaba.sp.gov.br/156sorocaba/api/Addresses/get?postalCode=' + $scope.CEP
            }).success(function (result) {
                $scope.Municipio = result.city;
                $scope.Logradouro = result.street;
                $scope.Bairro = result.district;
            });
        };

        $scope.voltar = function () {
            $Data.Localizacao = {
                CEP: $scope.CEP,
                Municipio: $scope.Municipio,
                Logradouro: $scope.Logradouro,
                Numero: $scope.Numero,
                Complemento: $scope.Complemento,
                Bairro: $scope.Bairro,
                Referencia: $scope.Referencia
            };

            $window.sessionStorage.setItem("Reclamacao", JSON.stringify($Data));

            $scope.irPara('DadosGerais');
        }

        $scope.prosseguir = function () {
            $Data.Localizacao = {
                CEP: $scope.CEP,
                Municipio: $scope.Municipio,
                Logradouro: $scope.Logradouro,
                Numero: $scope.Numero,
                Complemento: $scope.Complemento,
                Bairro: $scope.Bairro,
                Referencia: $scope.Referencia
            };

            $window.sessionStorage.setItem("Reclamacao", JSON.stringify($Data));

            $state.go('AbrirReclamacao.Revisao', $Data, {
                reload: true
            });
        };

        $scope.irPara = function (state) {
            $state.go('AbrirReclamacao.' + state, $Data, {
                reload: true
            });
        };

        $(document)
         .foundation({
             abide: {
                 patterns: {
                     cpf: /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/
                 }
             }
         });

        $scope.CarregarEnderecos();
    }])
    .controller('revisaoCtrl', ['$scope', '$http', 'Data', '$state', '$rootScope', '$window', function ($scope, $http, $Data, $state, $rootScope, $window) {

        $scope.Tentativas = 0;

        if (!$rootScope.user.isAuthenticated) {
            $state.go('AbrirReclamacao.Login', $Data, {
                reload: true
            });
        }

        var request = window.sessionStorage['Reclamacao'];
        if (request)
            $Data = JSON.parse(request);

        if ($Data.Assunto == "") {
            $state.go('Home.Solicitacao', $Data, {
                reload: true
            });
            return;
        }

        $scope.Solicitacao = $Data;

        $scope.irPara = function (state) {
            $state.go('AbrirReclamacao.' + state, $Data, {
                reload: true
            });
        };

        $scope.prosseguir = function () {

            $scope.Tentativas++;

            if ($scope.Tentativas > 1) {
                return;
            }

            var data = {
                SolicitanteId: $rootScope.user.id,
                DescricaoDetalhada: $Data.DescricaoDetalhada,
                GrupoDeServico: {
                    Id: $Data.GrupoServico.id,
                    Name: $Data.GrupoServico.name
                },
                TipoDeServico: {
                    Id: $Data.TipoServico.id,
                    Name: $Data.TipoServico.name
                },
                Assunto: {
                    Id: $Data.Assunto.id,
                    Name: $Data.Assunto.name
                },
                Address: {
                    PostalCode: $Data.Localizacao.CEP,
                    City: $Data.Localizacao.Municipio,
                    Street: $Data.Localizacao.Logradouro,
                    Number: $Data.Localizacao.Numero,
                    AdditionalInformation: $Data.Localizacao.Complemento,
                    District: $Data.Localizacao.Bairro,
                    State: 'SP',
                    PontoReferencia: $Data.Localizacao.Referencia
                }
            };

            $http.post("http://www.sorocaba.sp.gov.br/156sorocaba/api/Request", data)
            .success(function (data) {
                $scope.Tentativas = 0;
                $window.sessionStorage.removeItem("Reclamacao");
                $state.go('User.Requests', { newRequestGuid: data.value.numeroProtocolo }, {
                    reload: true
                });
            })
            .error(function (data, status, headers, config) {
                $scope.Tentativas = 0;
            });

            
        };

        $(document)
         .foundation({
             abide: {
                 patterns: {
                     cpf: /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/
                 }
             }
         });
    }]);