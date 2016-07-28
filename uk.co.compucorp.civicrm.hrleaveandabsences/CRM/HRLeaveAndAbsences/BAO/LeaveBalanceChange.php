<?php

class CRM_HRLeaveAndAbsences_BAO_LeaveBalanceChange extends CRM_HRLeaveAndAbsences_DAO_LeaveBalanceChange {

  /**
   * Create a new LeaveBalanceChange based on array-data
   *
   * @param array $params key-value pairs
   * @return CRM_HRLeaveAndAbsences_DAO_LeaveBalanceChange|NULL
   */
  public static function create($params) {
    $entityName = 'LeaveBalanceChange';
    $hook = empty($params['id']) ? 'create' : 'edit';

    CRM_Utils_Hook::pre($hook, $entityName, CRM_Utils_Array::value('id', $params), $params);
    $instance = new self();
    $instance->copyValues($params);
    $instance->save();
    CRM_Utils_Hook::post($hook, $entityName, $instance->id, $instance);

    return $instance;
  }
}