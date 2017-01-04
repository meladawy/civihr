#!/bin/bash

## About: Install the CiviHR extensions using drush

##################################
## List of CiviHR core extensions
CORE_EXTS=\
uk.co.compucorp.civicrm.hrcore

## List of extensions defining basic entity types
ENTITY_EXTS=\
org.civicrm.hrbank,\
org.civicrm.hrdemog,\
org.civicrm.hrident,\
org.civicrm.hrjobcontract,\
com.civicrm.hrjobroles,\
org.civicrm.hrabsence,\
org.civicrm.hrmed,\
org.civicrm.hrqual,\
org.civicrm.hrvisa,\
org.civicrm.hremergency,\
org.civicrm.hrcareer,\
uk.co.compucorp.contactaccessrights,\
uk.co.compucorp.civicrm.tasksassignments

## List of extensions defining applications/UIs on top of the basic entity types
APP_EXTS=\
org.civicrm.hrreport,\
org.civicrm.hrui,\
org.civicrm.hrcase,\
org.civicrm.hrim,\
org.civicrm.hrrecruitment,\
org.civicrm.reqangular,\
org.civicrm.contactsummary,\
org.civicrm.bootstrapcivicrm,\
org.civicrm.bootstrapcivihr


##################################
## Main

# Get CiviCRM Path and shift to the next option
CIVI_PATH=$1
shift

set -ex
drush "$@" cvapi extension.install keys=$CORE_EXTS,$ENTITY_EXTS,$APP_EXTS
set +ex

if [ "$WITH_HR_SAMPLE" == "1" ]; then
  set -ex
  drush "$@" cvapi extension.install keys=uk.co.compucorp.civicrm.hrsampledata
  set +ex
fi

# Install 'masquerade' module
drush en -y masquerade

