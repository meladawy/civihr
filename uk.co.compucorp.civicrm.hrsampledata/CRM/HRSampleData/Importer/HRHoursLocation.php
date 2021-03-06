<?php

/**
 * Class CRM_HRSampleData_Importer_HRHoursLocation
 */
class CRM_HRSampleData_Importer_HRHoursLocation extends CRM_HRSampleData_CSVImporterVisitor
{

  /**
   * {@inheritdoc}
   */
  protected function importRecord(array $row) {
    $hourLocationExists = $this->callAPI('HRHoursLocation', 'getcount', $row);
    if (!$hourLocationExists) {
      $this->callAPI('HRHoursLocation', 'create', $row);
    }
  }

}
