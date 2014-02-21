'use strict;'

angular.module('piathome.controllers', ['ui.bootstrap','ngRoute','ngSanitize','ngAnimate'])
    .controller('MainCtrl', ['$scope','$rootScope', '$location','$window','$http','piUrls',
                    'cordovaReady' ,'cordovaPush','$interval','$timeout','screenlog',
        function($scope,$rootScope, $location,$window,$http,piUrls,cordovaReady,cordovaPush,$interval,$timeout,screenlog) {

            cordovaReady.then(function() {
                screenlog.debug("Cordova Service is Ready");
            });
            
            
            $scope.playlist=[];            
            
            $http.get(piUrls.mediaList,{}).success(function(data, status) {
                if (data.success) {
                    $rootScope.files = data.data;
                }
            }).error(function(data, status) {

            });
            
            $http.get('/indicator',{}).success(function(data,status){
                data = data.split(" ");
                
                console.log("memory used=" + data[data.length-2]);
                $scope.used= data[data.length-2];
                
            }).error(function(data , status){
                console.log('failed to  get indicator data');
                
                });

            $scope.goBack = function() {
                $window.history.back();
            };
            $scope.goHome = function() {
                $location.path('/');
            };
            $scope.doSearch = function() {
                $scope.showSearchField=!$scope.showSearchField;
                if (!$scope.showSearchField)
                    $scope.search = null;
            };

            $rootScope.$on('$locationChangeStart', function(scope, next, current){ 
                var subpath = next.slice(next.indexOf('#')+2);
                $scope.showBackButton = subpath.indexOf('/') >= 0;
                $scope.showSearchButton = false;
                $scope.showGroupButton = false;
                if (subpath.length == 0) {
                    $scope.showSearchField = false;
                    $scope.search = null;
                }
                
                $scope.showEditButton= true;
                $scope.editButtonText= 'Edit';
                if (~next.indexOf('edit') || ~next.indexOf('playlist')) {
                    $scope.editButtonText= "Done";
                }                
            })

            $scope.$on('onlineStatusChange',function(event,status){
                $scope.onlineStatus = status?"green":"red";
            })            
            
            $scope.edit= function(e){
                if (e.target.innerText=='Done' && $location.path().indexOf('playlist') != '-1') {
                    $http.post(piUrls.playListWrite,{ playlist: $scope.playlist}).success(function(data, status) {
                        if (data.success) {
                            //console.log(data.stat_message);
                        }
                        }).error(function(data, status) {
                            console.log(status);
                        });
                }
                else if (e.target.innerText=='Edit' && $location.path().indexOf('assets') != '-1') {
                    $location.path($location.path()+"/edit/");
                }else{
                    $scope.goBack();
                }
            }         
    }]).
    controller('reportCtrl',['$scope',function($scope){
        $scope.$parent.$parent.title='Reports';
        $scope.$parent.$parent.button='edit';
    }]).
    controller('assetsCtrl',['$scope','$rootScope',
        function($scope, $rootScope){
            $scope.$parent.$parent.showEditButton= true;   
            $scope.done = function(files, data) {
                if(data.data != null) {
                    $rootScope.files.push(data.data.name);
                }
            }  
    }]).
    controller('assetViewCtrl',['$scope','$rootScope', '$http','piUrls', '$routeParams',
        function($scope, $rootScope, $http, piUrls, $routeParams){
            $scope.$parent.$parent.showEditButton= false;
            
            $http.get(piUrls.fileDetail,{ params: { file: $routeParams.file} }).success(function(data, status) {
            if (data.success) {
                $rootScope.filedetails = data;
                }
            }).error(function(data, status) {            
            });
            
            $scope.buttonshow = true;
            $scope.buttonhide = false;
            
            $scope.playFile = function(file , state) {
                console.log(file);
                $scope.buttonshow = !$scope.buttonshow  ;
                $scope.buttonhide = !$scope.buttonhide ;
                $http.post(piUrls.playFile,{file : file , state : state }).success(function(data, status) {
                    if (data.success) {
                        console.log(data.stat_message);
                    }
                }).error(function(data, status) {
                        console.log(status);
                    });
            }
            $scope.stopplay = function(){
                    $http.post(piUrls.playFile,{ playing : 'stop' }).success(function(data, status) {
                            if (data.success) {
                                console.log(data.stat_message);
                            }
                        }).error(function(data, status) {
                                console.log(status);
                            });
            }
    }]).
    controller('assetsEditCtrl',['$scope', '$http', '$rootScope', 'piUrls', '$route',
        function($scope, $http, $rootScope, piUrls, $route){
            $scope.done = function(files, data) {
                if(data.data != null) {
                    $rootScope.files.push(data.data.name);
                }
            }            
            $scope.delete= function(file){                
                $http.post(piUrls.fileDelete,{ file: file }).success(function(data, status) {
                    if (data.success) {
                        $rootScope.files.splice($rootScope.files.indexOf(file),1);                        
                    }
                }).error(function(data, status) {            
                });                
            }            
            $scope.rename= function(file, index){
                $scope.filescopy= angular.copy($rootScope.files);
                $http.get(piUrls.fileRename, { params: { newname: file, oldname: $scope.filescopy[index]} })
                .success(function(data, status) {
                    if (data.success) {
                        $rootScope.files.splice($rootScope.files.indexOf($scope.filescopy[index]), 1 , file); 
                        $route.reload();
                    }
                }).error(function(data, status) {            
                });
            }
    }]).
    controller('assetsRenameCtrl',['$scope','$route', '$http', '$rootScope', 'piUrls',
        function($scope, $route, $http, $rootScope, piUrls){
           
    }]).
    controller('playlistCtrl',['$scope', '$http', '$rootScope', 'piUrls', '$location',
        function($scope, $http, $rootScope, piUrls, $location){
        $scope.reorder=[];
        $http.get(piUrls.mediaList,{params: {cururl: $location.path()} }).success(function(data, status) {
            if (data.success) {
                $scope.playlistfiles = data.data;
                $scope.playlistfiles.forEach(function(itm){
                    var name= (typeof itm != 'object')? itm: itm.filename;
                    var ext= name.split('.')[1];
                    $scope.playlist.push({ filename: name, duration: 0, selected:'false', extension: ext});                    
                });
            }
        }).error(function(data, status) {
        });
        
        $scope.handleDrop= function(a, listHolder){           
            
        }
        
        $scope.done = function(files, data) {
            if(data.data != null) {
                var ext= data.data.name.split('.')[1];
                $rootScope.files.push(data.data.name);
                $scope.playlistfiles.push(data.data.name);
                $scope.playlist.push({ filename: data.data.name, duration: 0, selected:'false', extension:ext});
            }
        }       
    }])
    
