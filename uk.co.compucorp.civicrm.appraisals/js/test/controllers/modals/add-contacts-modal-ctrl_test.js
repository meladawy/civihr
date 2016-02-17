define([
    'common/angularMocks',
    'appraisals/app'
], function () {
    'use strict';

    describe('AddContactsModalCtrl', function () {
        var $modalInstance, ctrl;

        beforeEach(module('appraisals'));
        beforeEach(inject(function ($controller, $rootScope) {
            $modalInstance = jasmine.createSpyObj('modalInstance', ['close']);

            ctrl = $controller('AddContactsModalCtrl', {
                $modalInstance: $modalInstance,
                $scope: $rootScope.$new()
            });
        }));

        describe('inheritance', function () {
            it('inherits from BasicModalCtrl', function () {
                expect(ctrl.cancel).toBeDefined();
            });
        });
    });
})