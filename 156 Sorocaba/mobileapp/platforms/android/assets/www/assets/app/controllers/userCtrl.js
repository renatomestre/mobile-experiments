angular.module('user', [
    'ui.router',
    'ngCookies',
    'mm.foundation'
])
    .config(['$urlRouterProvider', '$stateProvider', function ($urlRouterProvider, $stateProvider) {

        //================================================
        // Routes
        //================================================
        $stateProvider
            .state('User', {
                abstract: true,
                url: "/User",
                templateUrl: "Views/User/Home.html",
                controller: ['$scope', '$http', 'Data', function ($scope, $http, $Data) {

                }]
            })
            .state('User.Profile', {
                url: "",
                templateUrl: "Views/User/Profile.html",
                controller: 'profileCtrl'
            })
            .state('User.Requests', {
                url: "/Requests/:newRequestGuid",
                templateUrl: "Views/User/Requests.html",
                controller: 'requestsCtrl'
            })
            .state('User.Request', {
                url: "/Request?protocolo&origem",
                templateUrl: "Views/User/Request.html",
                controller: 'requestCtrl'
            });


    }])
    .directive('phonenumberDirective', ['$filter', function($filter) {
        function link(scope, element, attributes) {
 
            // scope.inputValue is the value of input element used in template
            scope.inputValue = scope.phonenumberModel;
 
            scope.$watch('inputValue', function(value, oldValue) {
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
            template: '<input ng-model="inputValue" type="tel" class="phonenumber" placeholder="{{phonenumberPlaceholder}}" title="">',
        };
    }])
 
	.filter('phonenumber', function() {
	    return function (number) {
	        if (!number) { return ''; }
 
	        number = String(number);
 
	        var formattedNumber = number;
 
	        var c = '';
	        //number = number[0] == '1' ? number.slice(1) : number;
 
	        // (##) #####-#### as c (area) front-end
	        var area = number.substring(0,2);
	        var front = number.substring(2, 7);
	        var end = number.substring(7, 11);
 
	        if (front) {
	            formattedNumber = (c + "(" + area + ") " + front);	
	        }
	        if (end) {
	            formattedNumber += ("-" + end);
	        }
	        return formattedNumber;
	    };
	})
    .filter('cmdate', [
    '$filter', function ($filter) {
        return function (input, format) {
            return input == undefined ? input : $filter('date')(new Date(input), format);
        };
    }
    ])
    .filter('ifnull', [
    '$filter', function ($filter) {
        return function (input, format) {
            return input == undefined ? format : input;
        };
    }
    ])
    .filter('formatCpf', [
    '$filter', function ($filter) {
        return function (input, format) {
            try {
                var cpf = input.toString().substring(0, 3) + '.' + input.toString().substring(3, 6) + '.' + input.toString().substring(6, 9) + '-' + input.toString().substring(9, 11);
                return cpf;
            } catch (e) {
                return '---';
            }
        };
    }])
    .directive('ngValidabide', ['$parse', '$rootScope', function ($parse, $rootScope) {
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
    .directive('fileUpload', function () {
        return {
            scope: true,        //create a new scope
            link: function (scope, el, attrs) {
                el.bind('change', function (event) {
                    var files = event.target.files;
                    //iterate files since 'multiple' may be specified on the element
                    for (var i = 0; i < files.length; i++) {
                        //emit event upward
                        scope.$emit("fileSelected", { file: files[i] });
                    }
                });
            }
        };
    })
    .controller('profileCtrl', ['$scope', '$http', '$state', '$rootScope', '$window', '$filter', function ($scope, $http, $state, $rootScope, $window, $filter) {

        $scope.Tentativas = 0;

        if (!$rootScope.user.isAuthenticated) {
            window.location = '#/';
            return;
        }

        $scope.Profile = {
            Email: "",
            Nome: $rootScope.user.name,
            Sobrenome: '',
            CPF: $rootScope.user.cpf.toString().substring(0, 3) + '.' + $rootScope.user.cpf.toString().substring(3, 6) + '.' + $rootScope.user.cpf.toString().substring(6, 9) + '-' + $rootScope.user.cpf.toString().substring(9, 11),
            Telefone: {
                Residencial: "",
                Comercial: "",
                Celular: ""
            }
        };

        $scope.Enderecos = [];
        $scope.TipoEndereco = '';

        $http({
            method: 'GET',
            url: 'http://www.sorocaba.sp.gov.br/156sorocaba/api/users/profile'
        }).success(function (result) {
            $scope.Profile.Nome = result.contact.name;
            $scope.Profile.Sobrenome = result.contact.lastName;
            $scope.Profile.Email = result.contact.email;
            $scope.Profile.Telefone = {
                Residencial: result.contact.telephoneResidencial,
                Comercial: result.contact.telephone,
                Celular: result.contact.mobilePhone
            };
        });

        $scope.CarregarEnderecos = function () {
            $http({
                method: 'GET',
                url: 'http://www.sorocaba.sp.gov.br/156sorocaba/api/Contacts/enderecos'
            }).success(function (result) {
                $scope.Enderecos = result.addresses;
            });
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

        $scope.salvarDadosGerais = function () {

            $scope.Tentativas++;

            if ($scope.Tentativas > 1) {
                return;
            }

            var data = {
                TaxNumber: $rootScope.user.cpf,
                Name: $scope.Profile.Nome,
                LastName: $scope.Profile.Sobrenome,
                Email: $scope.Profile.Email,
                Telephone: $scope.Profile.Telefone.Comercial,
                TelephoneResidencial: $scope.Profile.Telefone.Residencial,
                MobilePhone: $filter('phonenumber')($scope.Profile.Telefone.Celular)
            };
            $http.post("http://www.sorocaba.sp.gov.br/156sorocaba/api/Contacts/dadosGerais", data)
            .success(function (data) {
                $scope.Tentativas = 0;
                alert('Dados Atualizados com sucesso!');
            })
            .error(function (data, status, headers, config) {
                $scope.Tentativas = 0;
                alert(data.message);
            });
        };

        $scope.salvarEndereco = function () {



            $scope.Tentativas++;

            if ($scope.Tentativas > 1) {
                return;
            }

            if ($scope.Enderecos.length > 0) {
                if ($scope.TipoEndereco == "EndereodeCorrespondncia") {

                    var correspondencia = $.grep($scope.Enderecos, function (value, i) {
                        return (value.tipoEndereco == "EndereodeCorrespondncia" && $scope.IdEndereco != value.id);
                    });

                    if (correspondencia.length > 0) {
                        var confirmacao = confirm('Já existe um endereço de Correspondência cadastrado. Se prosseguir você concordará em substituir o endereço atual de correspondência por este!\nDeseja Prosseguir?');

                        if (!confirmacao) {
                            $scope.Tentativas = 0;
                            return;
                        }
                    }
                }
            }

            var data = {
                Id: $scope.IdEndereco,
                TipoEndereco: $scope.TipoEndereco == 'Correspondecia' ? 3 : 4,
                PostalCode: $scope.CEP,
                City: $scope.Municipio,
                Street: $scope.Logradouro,
                Number: $scope.Numero,
                AdditionalInformation: $scope.Complemento,
                PontoReferencia: $scope.Referencia,
                District: $scope.Bairro,
                State: 'SP',
                TipoEndereco: $scope.TipoEndereco
            };

            $http.post("http://www.sorocaba.sp.gov.br/156sorocaba/api/contacts/endereco", data)
            .success(function (data) {
                $scope.CarregarEnderecos();
                $('#enderecoModal').foundation('reveal', 'close');
                $scope.Tentativas = 0;
                alert('Dados Atualizados com sucesso!');

            }).error(function (data, status, headers, config) {
                $scope.Tentativas = 0;
            });
        };

        $scope.showEnderecoModel = function (entity) {

            if (entity == '' || entity == undefined) {
                if ($scope.Enderecos.length == 0) {
                    $scope.NomeTipoEndereco = 'Correspondência';
                    $scope.TipoEndereco = 3;
                } else {
                    $scope.NomeTipoEndereco = 'Outros';
                    $scope.TipoEndereco = "ImvelResidencial";
                }
                $scope.CEP = '';
                $scope.Municipio = '';
                $scope.Logradouro = '';
                $scope.Numero = '';
                $scope.Complemento = '';
                $scope.Bairro = '';
                $scope.Referencia = '';
                $scope.IdEndereco = '';
                $scope.Nome = '';

            } else {
                $scope.CEP = entity.postalCode;
                $scope.Municipio = entity.city;
                $scope.Logradouro = entity.street;
                $scope.Numero = entity.number;
                $scope.Complemento = entity.additionalInformation;
                $scope.Bairro = entity.district;
                $scope.Referencia = entity.pontoReferencia;
                $scope.NomeTipoEndereco = entity.nomeTipoEndereco;
                $scope.TipoEndereco = entity.tipoEndereco;
                $scope.IdEndereco = entity.id;
                $scope.Nome = entity.nome;
            }


        }

        $('#dadosGeraisUsuarioForm')
         .foundation({
             abide: {
                 patterns: {
                     cpf: /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/
                 }
             }
         });

        $('#enderecoForm')
         .foundation({
             abide: {
                 patterns: {
                     cpf: /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/
                 }
             }
         });

        $scope.CarregarEnderecos();
    }])
    .controller('requestsCtrl', ['$scope', '$http', '$state', '$rootScope', '$window', '$stateParams', function ($scope, $http, $state, $rootScope, $window, $stateParams) {
        if (!$rootScope.user.isAuthenticated) {
            window.location = '#/';
            return;
        }

        $scope.ListaDeServicos = [];

        $http({
            method: 'GET',
            url: 'http://www.sorocaba.sp.gov.br/156sorocaba/api/Request'
        }).success(function (result) {
            $scope.ListaDeServicos = result.incidents;
        });

        if ($stateParams) {
            if ($stateParams.newRequestGuid) {
                $scope.NumeroProtocoloGerado = $stateParams.newRequestGuid;
                $('#protocoloNovoModal').foundation('reveal', 'open');
            }
        }

        $scope.ExibirSolicitacao = function (numeroProtocolo) {
            $state.go('User.Request', { protocolo: numeroProtocolo, origem: 1 }, {
                reload: true
            });
        }
    }])
    .controller('requestCtrl', ['$scope', '$http', '$state', '$rootScope', '$window', '$stateParams', function ($scope, $http, $state, $rootScope, $window, $stateParams) {

        $scope.Tentativas = 0;

        //if (!$rootScope.user.isAuthenticated) {
        //    window.location = '#/';
        //    return;
        //}

        if ($stateParams) {
            if ($stateParams.protocolo) {
                $scope.NumeroProtocolo = $stateParams.protocolo;
            } else {
                $state.go('User.Requests', {}, {
                    reload: true
                });
                return;
            }
        }

        $scope.origem = $stateParams.origem;
        $scope.PermiteAlterar = false;
        if ($scope.origem == undefined)
            $scope.origem = 1;

        $scope.Voltar = function () {
            if ($scope.origem == 1) {

                $state.go('User.Requests', {}, {
                    reload: true
                });
            } else {
                $state.go('Home.Consulta', {}, {
                    reload: true
                });
            }
        }

        $scope.$on("fileSelected", function (event, args) {
            $scope.$apply(function () {
                //add the file object to the scope's files collection
                $scope.Comuniquese.Anexos.push(args.file);
            });
        });

        $scope.showComuniquese = function (entity) {
            $scope.Comuniquese = {
                Requisicao: entity.requisicao,
                Resposta: entity.resposta,
                CriadoEm: entity.criadoEm,
                RazaoStatus: entity.razaoStatus,
                Id: entity.id,
                Anexos: []
            };
        }

        $scope.showConsultaComuniquese = function (entity) {
            $scope.Comuniquese = {
                Requisicao: entity.requisicao,
                Resposta: entity.resposta,
                CriadoEm: entity.criadoEm,
                RazaoStatus: entity.razaoStatus,
                Id: entity.id,
                Anexos: entity.anotacoes
            };
        }

        $scope.carregarAnexo = function () {

        }

        $scope.adicionarAnexo = function () {
            $scope.Comuniquese.Anexos[$scope.Comuniquese.Anexos.length] = {};
        };

        $scope.removerAnexo = function (index) {
            $scope.Comuniquese.Anexos.splice(index, 1);
        };

        $scope.salvarComuniquese = function () {
            $scope.Tentativas++;

            if ($scope.Tentativas > 1) {
                return;
            }

            var data = {
                Id: $scope.Comuniquese.Id,
                Resposta: $scope.Comuniquese.Resposta
            };

            //$http.post("http://www.sorocaba.sp.gov.br/156sorocaba/api/Request/comuniquese", data)
            //.success(function (data) {
            //    $scope.carregarOcorrencia();
            //    $('#comuniqueseModal').foundation('reveal', 'close');
            //    alert('Dados Atualizados com sucesso!');

            //});

            $http({
                method: 'POST',
                url: "http://www.sorocaba.sp.gov.br/156sorocaba/api/Request/comuniquese",
                //IMPORTANT!!! You might think this should be set to 'multipart/form-data' 
                // but this is not true because when we are sending up files the request 
                // needs to include a 'boundary' parameter which identifies the boundary 
                // name between parts in this multi-part request and setting the Content-type 
                // manually will not set this boundary parameter. For whatever reason, 
                // setting the Content-type to 'false' will force the request to automatically
                // populate the headers properly including the boundary parameter.
                headers: { 'Content-Type': undefined },
                //This method will allow us to change how the data is sent up to the server
                // for which we'll need to encapsulate the model data in 'FormData'
                transformRequest: function (data) {
                    var formData = new FormData();
                    //need to convert our json object to a string version of json otherwise
                    // the browser will do a 'toString()' on the object which will result 
                    // in the value '[Object object]' on the server.
                    formData.append("model", angular.toJson(data.model));
                    //now add all of the assigned files
                    for (var i = 0; i < data.files.length; i++) {
                        //add each file to the form data and iteratively name them
                        formData.append("file" + i, data.files[i]);
                    }
                    return formData;
                },
                //Create an object that contains the model and files which will be transformed
                // in the above transformRequest method
                data: { model: data, files: $scope.Comuniquese.Anexos }
            }).
            success(function (data, status, headers, config) {
                $scope.Tentativas = 0;
                $scope.carregarOcorrencia();
                $('#comuniqueseModal').foundation('reveal', 'close');
                alert('Dados Atualizados com sucesso!');
            }).
            error(function (data, status, headers, config) {
                alert("failed!");
                $scope.Tentativas = 0;
            });

        };

        $scope.carregarOcorrencia = function () {
            $http({
                method: 'GET',
                url: 'http://www.sorocaba.sp.gov.br/156sorocaba/api/Request?protocolo=' + $scope.NumeroProtocolo
            }).success(function (result) {
                $scope.Ocorrencia = result.incident;

                $scope.PermiteAlterar = result.incident.solicitanteId == $rootScope.user.idCRM;
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

        $scope.carregarOcorrencia();

    }]);