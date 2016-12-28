(function (CRM) {
  define([
    'common/angular',
    'common/lodash',
    'mocks/data/option-group-mock-data',
    'common/angularMocks',
    'leave-absences/shared/config',
    'mocks/apis/absence-period-api-mock',
    'mocks/apis/absence-type-api-mock',
    'mocks/apis/entitlement-api-mock',
    'mocks/apis/leave-request-api-mock',
    'leave-absences/my-leave/app'
  ], function (angular, _, optionGroupMock) {
    'use strict';

    describe('myLeaveReport', function () {
      var contactId = CRM.vars.leaveAndAbsences.contactId;
      var $compile, $q, $log, $provide, $rootScope, component, controller;
      var AbsencePeriod, AbsenceType, Entitlement, LeaveRequest, LeaveRequestInstance, OptionGroup;

      beforeEach(module('leave-absences.templates', 'my-leave', 'leave-absences.mocks', function (_$provide_) {
        $provide = _$provide_;
      }));
      beforeEach(inject(function (AbsencePeriodAPIMock, AbsenceTypeAPIMock, EntitlementAPIMock, LeaveRequestAPIMock) {
        $provide.value('AbsencePeriodAPI', AbsencePeriodAPIMock);
        $provide.value('AbsenceTypeAPI', AbsenceTypeAPIMock);
        $provide.value('EntitlementAPI', EntitlementAPIMock);
        $provide.value('LeaveRequestAPI', LeaveRequestAPIMock);
      }));

      beforeEach(inject(function (_$compile_, _$q_, _$log_, _$rootScope_, _$httpBackend_) {
        $compile = _$compile_;
        $q = _$q_;
        $log = _$log_;
        $rootScope = _$rootScope_;

        spyOn($log, 'debug');
      }));
      beforeEach(inject(function (_AbsencePeriod_, _AbsenceType_, _Entitlement_, _LeaveRequest_, _LeaveRequestInstance_, _OptionGroup_) {
        AbsencePeriod = _AbsencePeriod_;
        AbsenceType = _AbsenceType_;
        Entitlement = _Entitlement_;
        LeaveRequest = _LeaveRequest_;
        LeaveRequestInstance = _LeaveRequestInstance_;
        OptionGroup = _OptionGroup_;

        spyOn(AbsencePeriod, 'all').and.callThrough();
        spyOn(AbsenceType, 'all').and.callThrough();
        spyOn(Entitlement, 'all').and.callThrough();
        spyOn(Entitlement, 'breakdown').and.callThrough();
        spyOn(LeaveRequest, 'all').and.callThrough();
        spyOn(LeaveRequest, 'balanceChangeByAbsenceType').and.callThrough();
        spyOn(OptionGroup, 'valuesOf').and.callFake(function () {
          return $q.resolve(optionGroupMock.getCollection('hrleaveandabsences_leave_request_status'));
        });
      }));

      beforeEach(function () {
        compileComponent();
      });

      describe('initialization', function () {
        it('is initialized', function () {
          expect($log.debug).toHaveBeenCalled();
        });

        it('has all the sections collapsed', function () {
          expect(Object.values(controller.sections).every(function (section) {
            return section.isOpen === false;
          })).toBe(true);
        });

        it('contains the expected markup', function () {
          expect(component.find('.chr_leave-report').length).toBe(1);
        });

        describe('data loading', function () {
          xdescribe('before data is loaded', function () {
            // TODO: check why it doesn't work
            it('is in loading mode', function () {
              expect(controller.loading).toBe(true);
            });
          });

          describe('after data is loaded', function () {
            it('is out of loading mode', function () {
              expect(controller.loading).toBe(false);
            });

            it('has fetched the leave request statuses', function () {
              expect(OptionGroup.valuesOf).toHaveBeenCalledWith('hrleaveandabsences_leave_request_status');
              expect(controller.leaveRequestStatuses.length).not.toBe(0);
            });

            it('has fetched the absence types', function () {
              expect(AbsenceType.all).toHaveBeenCalled();
              expect(controller.absenceTypes.length).not.toBe(0);
            });

            it('has fetched the absence periods', function () {
              expect(AbsencePeriod.all).toHaveBeenCalled();
              expect(controller.absencePeriods.length).not.toBe(0);
            });

            it('has automatically selected the current period', function () {
              expect(controller.currentPeriod).not.toBe(null);
              expect(controller.currentPeriod).toBe(_.find(controller.absencePeriods, function (period) {
                return period.current === true;
              }));
            });

            describe('entitlements', function () {
              it('has fetched all the entitlements', function () {
                expect(Entitlement.all).toHaveBeenCalled();
                expect(controller.entitlements.length).not.toBe(0);
              });

              it('has fetched the entitlements for the current contact and period', function () {
                expect(Entitlement.all.calls.argsFor(0)[0]).toEqual({
                  contact_id: contactId,
                  period_id: controller.currentPeriod.id
                });
              });

              it('has fetched both current and future balance of the entitlements', function () {
                expect(Entitlement.all.calls.argsFor(0)[1]).toEqual(true);
              });
            });

            describe('balance changes', function () {
              it('has fetched the balance changes for the current contact and period', function () {
                var args = LeaveRequest.balanceChangeByAbsenceType.calls.argsFor(0)[0];

                expect(args).toEqual(jasmine.objectContaining({
                  contact_id: contactId,
                  period_id: controller.currentPeriod.id
                }));
              });

              it('has fetched the balance changes for the public holidays', function () {
                expect(LeaveRequest.balanceChangeByAbsenceType).toHaveBeenCalledWith(jasmine.objectContaining({
                  public_holiday: true
                }));
                expect(controller.balanceChanges.publicHolidays).not.toBe(0);
              });

              it('has fetched the balance changes for the approved requests', function () {
                expect(LeaveRequest.balanceChangeByAbsenceType).toHaveBeenCalledWith(jasmine.objectContaining({
                  statuses: [ '<value of OptionValue "approved">' ]
                }));
                expect(controller.balanceChanges.approved).not.toBe(0);
              });

              it('has fetched the balance changes for the open requests', function () {
                expect(LeaveRequest.balanceChangeByAbsenceType).toHaveBeenCalledWith(jasmine.objectContaining({
                  statuses: [
                    '<value of OptionValue "awaiting approval">',
                    '<value of OptionValue "more information">'
                  ]
                }));
                expect(controller.balanceChanges.open).not.toBe(0);
              });
            });
          });
        });
      });

      describe('when changing the absence period', function () {
        var newPeriod;

        beforeEach(function () {
          newPeriod = _(controller.absencePeriods).filter(function (period) {
            return !period.current;
          }).sample();
        });

        describe('basic tests', function () {
          beforeEach(function () {
            Entitlement.all.calls.reset();
            LeaveRequest.balanceChangeByAbsenceType.calls.reset();

            controller.changePeriod(newPeriod);
          });

          it('sets the new current period', function () {
            expect(controller.currentPeriod).toBe(newPeriod);
          });

          it('goes into loading mode', function () {
            expect(controller.loading).toBe(true);
          });

          it('reloads the entitlements', function () {
            expect(Entitlement.all).toHaveBeenCalled();
            expect(Entitlement.all.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({
              period_id: newPeriod.id
            }));
          });

          it('reloads all the balance changes', function () {
            var args = LeaveRequest.balanceChangeByAbsenceType.calls.argsFor(_.random(0, 2))[0];

            expect(LeaveRequest.balanceChangeByAbsenceType).toHaveBeenCalledTimes(3);
            expect(args).toEqual(jasmine.objectContaining({
              period_id: newPeriod.id
            }));
          });
        });

        describe('open sections', function () {
          beforeEach(function () {
            controller.sections.approved.isOpen = true;
            controller.sections.entitlements.isOpen = true;

            controller.changePeriod(newPeriod);
            $rootScope.$digest();
          });

          it('reloads all data for sections already opened', function () {
            expect(LeaveRequest.all).toHaveBeenCalledWith(jasmine.objectContaining({
              from_date: { from: newPeriod.start_date },
              to_date: {to: newPeriod.end_date },
              status: '<value of OptionValue "approved">'
            }));
            expect(Entitlement.breakdown).toHaveBeenCalledWith(jasmine.objectContaining({
              period_id: newPeriod.id
            }), jasmine.any(Array));
          });
        });

        describe('closed sections', function () {
          beforeEach(function () {
            controller.sections.holidays.data = [jasmine.any(Object), jasmine.any(Object)];
            controller.sections.open.data = [jasmine.any(Object), jasmine.any(Object)];

            controller.changePeriod(newPeriod);
            $rootScope.$digest();
          });

          it('removes all cached data for sections that are closed', function () {
            expect(controller.sections.holidays.data.length).toBe(0);
            expect(controller.sections.open.data.length).toBe(0);
          });
        });

        describe('after loading', function () {
          beforeEach(function () {
            $rootScope.$digest();
          });

          it('goes out of loading mode', function () {
            expect(controller.loading).toBe(false);
          });
        });
      });

      describe('when opening a section', function () {
        describe('data caching', function () {
          describe('when the section had not been opened yet', function () {
            beforeEach(function () {
              openSection('approved');
            });

            it('makes a request to fetch the data', function () {
              expect(LeaveRequest.all).toHaveBeenCalled();
            });
          });

          describe('when the section had already been opened', function () {
            beforeEach(function () {
              controller.sections.approved.data = [jasmine.any(Object), jasmine.any(Object)];

              openSection('approved');
            });

            it('does not make another request to fetch the data', function () {
              expect(LeaveRequest.all).not.toHaveBeenCalled();
            });
          });
        });

        describe('section: Period Entitlement', function () {
          beforeEach(function () {
            openSection('entitlements');
          });

          it('fetches the entitlements breakdown', function () {
            expect(Entitlement.breakdown).toHaveBeenCalled();
          });

          it('passes to the Model the entitlements already stored', function () {
            expect(Entitlement.breakdown).toHaveBeenCalledWith(jasmine.any(Object), controller.entitlements);
          });

          it('caches the data', function () {
            expect(controller.sections.entitlements.data.length).not.toBe(0);
          });
        });

        describe('section: Public Holidays', function () {
          beforeEach(function () {
            openSection('holidays');
          });

          it('fetches all leave requests linked to a public holiday', function () {
            expect(LeaveRequest.all).toHaveBeenCalledWith(jasmine.objectContaining({
              public_holiday: true
            }));
          });

          it('caches the data', function () {
            expect(controller.sections.holidays.data.length).not.toBe(0);
          });
        });

        describe('section: Approved Requests', function () {
          beforeEach(function () {
            openSection('approved');
          });

          it('fetches all approved leave requests', function () {
            expect(LeaveRequest.all).toHaveBeenCalledWith(jasmine.objectContaining({
              status: '<value of OptionValue "approved">'
            }));
          });

          it('caches the data', function () {
            expect(controller.sections.approved.data.length).not.toBe(0);
          });
        });

        describe('section: Open Requests', function () {
          beforeEach(function () {
            openSection('open');
          });

          it('fetches all pending leave requests', function () {
            expect(LeaveRequest.all).toHaveBeenCalledWith(jasmine.objectContaining({
              status: { in: [
                '<value of OptionValue "awaiting approval">',
                '<value of OptionValue "more information">'
              ] }
            }));
          });

          it('caches the data', function () {
            expect(controller.sections.open.data.length).not.toBe(0);
          });
        });

        describe('section: Expired', function () {
          beforeEach(function () {
            openSection('expired');
          });

          it('fetches all expired balance changes', function () {
            expect(Entitlement.breakdown).toHaveBeenCalledWith(jasmine.objectContaining({
              expired: true
            }));
          });

          it('caches the data', function () {
            expect(controller.sections.expired.data.length).not.toBe(0);
          });
        });

        describe('section: Cancelled and Other', function () {
          beforeEach(function () {
            openSection('other');
          });

          it('fetches all cancelled/rejected leave requests', function () {
            expect(LeaveRequest.all).toHaveBeenCalledWith(jasmine.objectContaining({
              status: { in: [
                '<value of OptionValue "rejected">',
                '<value of OptionValue "cancelled">'
              ] }
            }));
          });

          it('caches the data', function () {
            expect(controller.sections.other.data.length).not.toBe(0);
          });
        });

        /**
         * Open the given section and runs the digest cycle
         *
         * @param {string} section
         */
        function openSection(section) {
          controller.openSection(section);
          $rootScope.$digest();
        }
      });

      describe('action matrix for a leave request', function () {
        var actionMatrix;

        describe('status: awaiting approval', function () {
          beforeEach(function () {
            actionMatrix = getActionMatrixForStatus('waiting_approval');
          });

          it('shows the "edit" and "cancel" actions', function () {
            expect(actionMatrix.length).toBe(2);
            expect(actionMatrix).toContain('edit');
            expect(actionMatrix).toContain('cancel');
          });
        });

        describe('status: more information required', function () {
          beforeEach(function () {
            actionMatrix = getActionMatrixForStatus('more_information_requested');
          });

          it('shows the "respond" and "cancel" actions', function () {
            expect(actionMatrix.length).toBe(2);
            expect(actionMatrix).toContain('respond');
            expect(actionMatrix).toContain('cancel');
          });
        });

        describe('status: approved', function () {
          beforeEach(function () {
            actionMatrix = getActionMatrixForStatus('approved');
          });

          it('shows the "cancel" action', function () {
            expect(actionMatrix.length).toBe(1);
            expect(actionMatrix).toContain('cancel');
          });
        });

        describe('status: cancelled', function () {
          beforeEach(function () {
            actionMatrix = getActionMatrixForStatus('cancelled');
          });

          it('shows no actions', function () {
            expect(actionMatrix.length).toBe(0);
          });
        });

        describe('status: rejected', function () {
          beforeEach(function () {
            actionMatrix = getActionMatrixForStatus('rejected');
          });

          it('shows no actions', function () {
            expect(actionMatrix.length).toBe(0);
          });
        });

        /**
         * Calls the controller method that returns the action matrix for
         * a given Leave Request
         *
         * @param  {string} statusName
         * @return {Array}
         */
        function getActionMatrixForStatus(statusName) {
          return controller.actionsFor(createRequestWithStatus(statusName));
        }

        /**
         * Creates a Leave Request instance with the id of the given status
         *
         * @param  {string} statusName
         * @return {LeaveRequestInstance}
         */
        function createRequestWithStatus(statusName) {
          var statuses = optionGroupMock.getCollection('hrleaveandabsences_leave_request_status');

          return LeaveRequestInstance.init({
            status_id: _.find(statuses, function (status) {
              return status.name === statusName;
            }).id
          });
        }
      });

      describe('when cancelling a leave request', function () {
        it('shows a confirmation dialog', function () {

        });

        describe('when the user confirms', function () {
          it('sends the cancellation request', function () {

          });
        });

        describe('when the user does not confirm', function () {
          it('does not send the cancellation request', function () {

          });
        });
      });

      function compileComponent() {
        var $scope = $rootScope.$new();

        component = angular.element('<my-leave-report contact-id="' + contactId + '"></my-leave-report>');
        $compile(component)($scope);
        $scope.$digest();

        controller = component.controller('myLeaveReport');
      }
    });
  })
})(CRM);
