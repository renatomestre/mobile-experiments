angular.module('cadastro', [
    'ui.router',
    'ngCookies'
])
    .factory('CadastroData', function () {
        return {
            Origem: 1,
            Nome: "",
            Sobrenome: "",
            Email: "",
            CPF: "",
            Senha: "",
            ConfirmaSenha: "",
            Telefone: {
                Residencial: "",
                Comercial: "",
                Celular: ""
            },
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
            .state('Cadastro', {
                abstract: true,
                url: "/Cadastro",
                templateUrl: "Views/Cadastro/Home.html",
                controller: ['$scope', '$http', 'Data', function ($scope, $http, $Data) {

                }]
            })
            .state('Cadastro.DadosGerais', {
                url: "?origem",
                templateUrl: "Views/Cadastro/DadosGerais.html",
                controller: 'dadosGeraisCtrl'
            })
            .state('Cadastro.Endereco', {
                url: "/Endereco",
                templateUrl: "Views/Cadastro/Endereco.html",
                controller: 'enderecoCtrl'
            });


    }])
    .directive('fonenumberDirective', ['$filter', function ($filter) {
        function link(scope, element, attributes) {

            // scope.inputValue is the value of input element used in template
            scope.inputValue = scope.phonenumberModel;

            scope.$watch('inputValue', function (value, oldValue) {
                value = String(value);
                var number = value.replace(/[^0-9]+/g, '');
                scope.phonenumberModel = number;
                scope.inputValue = $filter('phonenumber')(number);
            });

            scope.$parent.$watch(attributes.model, function (value, oldValue) {
                value = String(value);
                var number = value.replace(/[^0-9]+/g, '');
                scope.inputValue = $filter('phonenumber')(number);
            });
        }

        return {
            link: link,
            restrict: 'E',
            scope: {
                phonenumberPlaceholder: '=placeholder',
                phonenumberModel: '=model',
            },
            template: '<input ng-model="inputValue" type="tel" class="phonenumber" placeholder="{{fonenumberPlaceholder}}" title="">',
        };
    }])
    .directive('ngValidabide', ['$parse', '$rootScope', function ($parse, $rootScope) {
        return {
            restrict: 'A',
            //scope: { 'ngValidabide': '=' },
            link: function (scope, element, attrs) {
                var fn = $parse($(element).attr['ng-validabide'], /* interceptorFn */ null, /* expensiveChecks */ true);
                $(element).on('valid', function () {
                    scope.$apply($(element).attr('ng-validabide'));
                });

                $(element).on('invalid', function () {
                    $('input.ng-invalid', $(element))[0].focus();
                });
            }
        }
    }])
    .controller('dadosGeraisCtrl', ['$scope', '$http', 'CadastroData', '$state', '$cookieStore', '$rootScope', '$stateParams', function ($scope, $http, $CadastroData, $state, $cookieStore, $rootScope, $stateParams) {

        $scope.Tentativas = 0;

        $scope.Nome = $CadastroData.Nome;
        $scope.Sobrenome = $CadastroData.Sobrenome;
        $scope.Email = $CadastroData.Email;
        $scope.CPF = $CadastroData.CPF;
        $scope.Senha = $CadastroData.Senha;
        $scope.ConfirmaSenha = $CadastroData.ConfirmaSenha;

        $scope.Telefone = $CadastroData.Telefone;

        if ($stateParams) {

            if ($stateParams.origem == undefined) {
                $stateParams.origem = 1;
            }

            $CadastroData.Origem = $stateParams.origem;
        }

        $('#loginModal').foundation('reveal', 'close');

        $scope.carregarCpf = function () {
            if ($scope.CPF != '') {
                $http({
                    method: 'GET',
                    url: 'http://www.sorocaba.sp.gov.br/156sorocaba/api/Contacts?taxNumber=' + $scope.CPF
                }).success(function (result) {
                    $("form div.limpaCpf").removeClass("error");
                    $("form label.limpaCpf").removeClass("error");
                    if (result.contact) {
                        $scope.Nome = result.contact.name;
                        $scope.Sobrenome = result.contact.lastName;
                        $scope.Email = result.contact.email;
                        $scope.Telefone = {
                            Comercial: result.contact.telephone,
                            Residencial: result.contact.telephoneResidencial,
                            Celular: result.contact.mobilePhone
                        };

                        $CadastroData.Localizacao = {
                            Id: result.contact.mailingAddress.id,
                            CEP: result.contact.mailingAddress.postalCode,
                            Municipio: result.contact.mailingAddress.city,
                            Logradouro: result.contact.mailingAddress.street,
                            Numero: result.contact.mailingAddress.number,
                            Complemento: result.contact.mailingAddress.additionalInformation,
                            Bairro: result.contact.mailingAddress.district,
                            Referencia: ''
                        };
                    } else {
                        //$scope.Nome = '';
                        //$scope.Sobrenome = '';
                        //$scope.Email = '';
                    }
                });
            }

        };

        $scope.prosseguir = function () {

            $scope.Tentativas++;

            if ($scope.Tentativas > 1) {
                return;
            }


            $CadastroData.Nome = $scope.Nome;
            $CadastroData.Sobrenome = $scope.Sobrenome;
            $CadastroData.Email = $scope.Email;
            $CadastroData.CPF = $scope.CPF;
            $CadastroData.Senha = $scope.Senha;
            $CadastroData.ConfirmaSenha = $scope.ConfirmaSenha;
            $CadastroData.Telefone = $scope.Telefone;

            $state.go('Cadastro.Endereco', $CadastroData, {
                reload: true
            });

            $scope.Tentativas = 0;
        };

        $scope.irPara = function (state) {
            $state.go('Cadastro.' + state, $CadastroData, {
                reload: true
            });
        };

        $('#dadosGeraisForm')
     .foundation({
         abide: {
             focus_on_invalid: false,
             patterns: {
                 cpf: /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/,
                 password: /^(.){4,}$/
             },
             validators: {
                 digitoCpf: function (el, required, parent) {
                     
                     var cpf = el.value.replace('.', '').replace('.', '').replace('-', '');

                     if (required && cpf == '') return false;

                     var numeros, digitos, soma, i, resultado, digitos_iguais;
                     digitos_iguais = 1;
                     if (cpf.length < 11)
                         return false;
                     for (i = 0; i < cpf.length - 1; i++)
                         if (cpf.charAt(i) != cpf.charAt(i + 1)) {
                             digitos_iguais = 0;
                             break;
                         }
                     if (!digitos_iguais) {
                         numeros = cpf.substring(0, 9);
                         digitos = cpf.substring(9);
                         soma = 0;
                         for (i = 10; i > 1; i--)
                             soma += numeros.charAt(10 - i) * i;
                         resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
                         if (resultado != digitos.charAt(0))
                             return false;
                         numeros = cpf.substring(0, 10);
                         soma = 0;
                         for (i = 11; i > 1; i--)
                             soma += numeros.charAt(11 - i) * i;
                         resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
                         if (resultado != digitos.charAt(1))
                             return false;
                         return true;
                     }
                     else
                         return false;
                 }
             }
         }
     });

        $scope.carregarCpf();

    }])
.controller('enderecoCtrl', ['$scope', '$http', 'CadastroData', '$state', '$cookieStore', '$location', '$rootScope', function ($scope, $http, $CadastroData, $state, $cookieStore, $location, $rootScope) {

    if ($CadastroData.CPF == '') {
        $state.go('Cadastro.DadosGerais', $CadastroData, {
            reload: true
        });
        return;
    }

    if ($CadastroData.Localizacao) {
        $scope.IdEndereco = $CadastroData.Localizacao.Id;
        $scope.CEP = $CadastroData.Localizacao.CEP;
        $scope.Municipio = $CadastroData.Localizacao.Municipio;
        $scope.Logradouro = $CadastroData.Localizacao.Logradouro;
        $scope.Numero = $CadastroData.Localizacao.Numero;
        $scope.Complemento = $CadastroData.Localizacao.Complemento;
        $scope.Bairro = $CadastroData.Localizacao.Bairro;
        $scope.Referencia = $CadastroData.Localizacao.Referencia;
    }

    $scope.Tentativas = 0;

    $scope.irPara = function (state) {
        $state.go('Cadastro.' + state, $CadastroData, {
            reload: true
        });
    };

    $scope.carregarCep = function () {
        $http({
            method: 'GET',
            url: 'http://www.sorocaba.sp.gov.br/156sorocaba/api/Addresses/get?postalCode=' + $scope.CEP
        }).success(function (result) {
            $("form div").removeClass("error");
            $("form label").removeClass("error");
            $scope.Municipio = result.city;
            $scope.Logradouro = result.street;
            $scope.Bairro = result.district;

        });
    };

    $scope.entrar = function (callback) {
        var params = "grant_type=password&username=" + $CadastroData.CPF + "&password=" + $CadastroData.Senha;
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
                cpf: data.userName,
                isAuthenticated: true,
                name: data.name
            });

            $cookieStore.put("_Token", data.access_token);

            callback();
        })
        .error(function (data, status, headers, config) {
            alert(data.error_description.replace(/["']{1}/gi, ""));
        });
    };

    $scope.voltar = function () {

        $CadastroData.Localizacao = {
            Id: $scope.IdEndereco,
            CEP: $scope.CEP,
            Municipio: $scope.Municipio,
            Logradouro: $scope.Logradouro,
            Numero: $scope.Numero,
            Complemento: $scope.Complemento,
            Bairro: $scope.Bairro,
            Referencia: $scope.Referencia
        };

        $scope.irPara('DadosGerais');
    }

    $scope.prosseguir = function () {

        $scope.Tentativas++;

        if ($scope.Tentativas > 1) {
            return;
        }

        $CadastroData.Localizacao = {
            Id: $scope.IdEndereco,
            CEP: $scope.CEP,
            Municipio: $scope.Municipio,
            Logradouro: $scope.Logradouro,
            Numero: $scope.Numero,
            Complemento: $scope.Complemento,
            Bairro: $scope.Bairro,
            Referencia: $scope.Referencia
        };

        var contactData = {
            TaxNumber: $CadastroData.CPF,
            Name: $CadastroData.Nome,
            LastName: $CadastroData.Sobrenome,
            Email: $CadastroData.Email,
            Telephone: $CadastroData.Telefone.Comercial,
            TelephoneResidencial: $CadastroData.Telefone.Residencial,
            MobilePhone: $CadastroData.Telefone.Celular,
            MailingAddress: {
                Id: $CadastroData.Localizacao.Id,
                TipoEndereco: 3,
                PostalCode: $CadastroData.Localizacao.CEP,
                City: $CadastroData.Localizacao.Municipio,
                Street: $CadastroData.Localizacao.Logradouro,
                Number: $CadastroData.Localizacao.Numero,
                AdditionalInformation: $CadastroData.Localizacao.Complemento,
                District: $CadastroData.Localizacao.Bairro,
                State: 'SP'
            }
        };

        var modelData = {
            TaxNumber: $CadastroData.CPF,
            Name: $CadastroData.Nome + ' ' + $CadastroData.Sobrenome,
            Email: $CadastroData.Email,
            Password: $CadastroData.Senha,
            ContactModel: contactData
        };

        $http.post("http://www.sorocaba.sp.gov.br/156sorocaba/api/users", modelData)
           .success(function (data) {
               $scope.Tentativas = 0;
               alert('Usuário criado com sucesso!');

               $scope.entrar(function () {
                   if ($CadastroData.Origem == 1)
                       $location.url('/');
                   else {
                       $state.go('AbrirReclamacao.DadosGerais', {}, {
                           reload: true
                       });
                   }
               });

           })
            .error(function (data, status, headers, config) {
                if (data) {
                    if (data.message) {
                        alert(data.message);
                        $scope.Tentativas = 0;
                        return;
                    }
                }

                alert('Já existe um usuário com este CPF cadastrado!');
                $scope.Tentativas = 0;
                return;
            });

    };

    $('#enderecoForm')
     .foundation({
         abide: {
             patterns: {
                 cpf: /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/
             }
         }
     });

}]);