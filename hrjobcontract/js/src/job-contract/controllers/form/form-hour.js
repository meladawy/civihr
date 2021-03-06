define([
  'job-contract/vendor/fraction',
  'job-contract/controllers/controllers'
], function (Fraction, controllers) {
  'use strict';

  controllers.controller('FormHourCtrl',['$scope', '$rootScope', '$filter', '$log',
    function ($scope, $rootScope, $filter, $log) {
      $log.debug('Controller: FormHourCtrl');

      var entityHour = $scope.entity.hour,
        utilsHoursLocation = $scope.utils.hoursLocation,
        locStandHrs = {};

      $scope.hrsTypeDefined = false;
      $scope.hrsAmountDefined = false;
      entityHour.location_standard_hours = entityHour.location_standard_hours || "1";
      locStandHrs = $filter('getObjById')(utilsHoursLocation, entityHour.location_standard_hours);

      function updateHours(locStandHrs, hrsTypeId) {
        $scope.hrsTypeDefined = !!entityHour.hours_type;
        $scope.hrsAmountDefined = !!entityHour.hours_amount;

        if ($scope.hrsTypeDefined && !$scope.hrsAmountDefined) {
          entityHour.hours_unit = locStandHrs.periodicity;

          switch(+hrsTypeId) {
            case 8:
              entityHour.hours_amount = locStandHrs.standard_hours;
              break;
            case 4:
              entityHour.hours_amount = Math.round(locStandHrs.standard_hours / 2);
              break;
            case 0:
              entityHour.hours_amount = 0;
              break;
            default:
              entityHour.hours_amount = '';
          }
        } else if (!$scope.hrsAmountDefined && !$scope.hrsAmountDefined) {
          entityHour.hours_amount = '';
          entityHour.hours_unit = '';
        }
      }

      function updateFTE(hrsStandard, hrsAmount){

        hrsAmount = parseFloat(hrsAmount) || 0,
        hrsStandard = parseFloat(hrsStandard) || 0;

        var fteFraction = new Fraction(hrsAmount, hrsStandard);

        entityHour.fte_num = String(+entityHour.hours_type ? fteFraction.numerator : 0);
        entityHour.fte_denom = String(+entityHour.hours_type ? fteFraction.denominator : 0);
        entityHour.hours_fte = String(parseFloat(((entityHour.fte_num/entityHour.fte_denom) || 0).toFixed(2)));

        $scope.fteFraction = entityHour.fte_num + '/' + entityHour.fte_denom;
      }

      $scope.$watch('entity.hour.location_standard_hours', function(locStandHrsId){
        locStandHrs = $filter('getObjById')(utilsHoursLocation, locStandHrsId);
        updateHours(locStandHrs, entityHour.hours_type);
        updateFTE(locStandHrs.standard_hours, entityHour.hours_amount);
      });

      $scope.$watch('entity.hour.hours_type', function(hrsTypeId, hrsTypeIdPrev){
        if (hrsTypeId != hrsTypeIdPrev) {
          updateHours(locStandHrs, hrsTypeId);
          updateFTE(locStandHrs.standard_hours, entityHour.hours_amount);
        }
      });

      $scope.$watch('entity.hour.hours_amount', function(hrsAmount, hrsAmountPrev){
        if (hrsAmount != hrsAmountPrev) {
          updateFTE(locStandHrs.standard_hours, hrsAmount);
        }
      });

      $scope.$watch('entity.hour.hours_unit', function(hrsUnit, hrsUnitPrev){
        if (hrsUnit != hrsUnitPrev) {
          updateFTE(locStandHrs.standard_hours, entityHour.hours_amount);
        }
      });
    }
  ]);
});
