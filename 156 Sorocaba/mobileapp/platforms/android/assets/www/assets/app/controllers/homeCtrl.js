angular.module('home', [
    'ui.router',
    'abrirReclamacao',
    'ngSanitize'
])
    .config(['$urlRouterProvider', '$stateProvider', function ($urlRouterProvider, $stateProvider) {

        //================================================
        // Routes
        //================================================
        $stateProvider
            .state('Home', {
                abstract: true,
                url: "/Home",
                templateUrl: "Views/Home.html"
            })
            .state('Home.Acessados', {
                //abstract: true,
                url: "",
                templateUrl: "Views/Acessados.html"
            })
            .state('Home.Consulta', {
                //abstract: true,
                url: "/Consulta",
                templateUrl: "Views/Consulta.html",
                controller: 'consultaCtrl'
            })
            .state('Home.Solicitacao', {
                //abstract: true,
                url: "/Solicitacao",
                templateUrl: "Views/Solicitacao.html",
                controller: 'solicitacaoCtrl'
            });


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
            }
        }
    }])
    .controller('homeCtrl', ['$scope', '$http', function ($scope, $http) {

    }])
    .controller('solicitacaoCtrl', ['$scope', '$http', 'Data', '$state', '$sce', '$window', function ($scope, $http, $Data, $state, $sce, $window) {
        $scope.GruposServico = [];
        $scope.GrupoServicoSelecionado = "";
        $scope.TiposServico = [];
        $scope.TipoServicoSelecionado = "";
        $scope.Assuntos = [];
        $scope.AssuntoSelecionado = "";
        $scope.exibeTiposServico = false;
        $scope.exibeAssuntos = false;
        $scope.exibeArtigoAssunto = false;
        $scope.Artigo = "";

        $scope.fechar = function () {
            $state.go('Home.Acessados', $Data, {
                reload: true
            });
        };

        $scope.loadTiposServico = function () {

            if ($scope.GrupoServicoSelecionado.name == 'Aprove Fácil') {
                window.location = '/AproveFacil';
                retunr;
            }

            $scope.TiposServico = [];
            $scope.Assuntos = [];
            $scope.exibeArtigoAssunto = false;
            $scope.exibeTiposServico = false;
            $scope.exibeAssuntos = false;
            $scope.Artigo = "";
            $http({
                method: 'GET',
                url: 'http://www.sorocaba.sp.gov.br/156sorocaba/api/Request/TiposServico?idGrupoServico=' + $scope.GrupoServicoSelecionado.id
            }).success(function (result) {
                $scope.TiposServico = result.assuntos;
                $scope.exibeTiposServico = true;
            });
        };

        $scope.loadAssuntos = function () {
            $scope.Assuntos = [];
            $scope.exibeArtigoAssunto = false;
            $scope.exibeAssuntos = false;
            $scope.Artigo = "";

            $http({
                method: 'GET',
                url: 'http://www.sorocaba.sp.gov.br/156sorocaba/api/Request/Assuntos?idTipoServico=' + $scope.TipoServicoSelecionado.id
            }).success(function (result) {
                $scope.Assuntos = result.assuntos;
                $scope.exibeAssuntos = true;
            });
        };

        $scope.loadArtigo = function () {
            $scope.Artigo = "";
            $scope.exibeArtigo = false;
            $http({
                method: 'GET',
                url: 'http://www.sorocaba.sp.gov.br/156sorocaba/api/Request/Artigo?grupo=' + encodeURIComponent($scope.GrupoServicoSelecionado.name) + '&tipo=' + encodeURIComponent($scope.TipoServicoSelecionado.name) + '&assunto=' + encodeURIComponent($scope.AssuntoSelecionado.name)
            }).success(function (result) {
                $scope.Artigo = result.content;
                $scope.ArtigoUrl = result.url;
                $scope.exibeArtigoAssunto = true;
            });


        };

        $scope.TrustArtigo = function () {

            return $sce.trustAsHtml($scope.Artigo);
        };

        $scope.openRequest = function () {
            $Data.GrupoServico = $scope.GrupoServicoSelecionado;
            $Data.TipoServico = $scope.TipoServicoSelecionado;
            $Data.Assunto = $scope.AssuntoSelecionado;

            $window.sessionStorage.setItem("Reclamacao", JSON.stringify($Data));

            $state.go('AbrirReclamacao.Login', $Data, {
                reload: true
            });
        };

        $http({
            method: 'GET',
            url: 'http://www.sorocaba.sp.gov.br/156sorocaba/api/Request/GruposServico'
        }).success(function (result) {
            $scope.GruposServico = result.assuntos;
        });


    }])
    .controller('consultaCtrl', ['$scope', '$http', 'Data', '$state', '$sce', function ($scope, $http, $Data, $state, $sce) {

        $scope.fechar = function () {
            $state.go('Home.Acessados', $Data, {
                reload: true
            });
        };

        $scope.Pesquisar = function () {
            $state.go('User.Request', { protocolo: $scope.Protocolo, origem: 2 }, {
                reload: true
            });
        };

        $('#pesquisaForm')
    .foundation({
        abide: {
            patterns: {
                cpf: /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/
            }
        }
    });


    }]);