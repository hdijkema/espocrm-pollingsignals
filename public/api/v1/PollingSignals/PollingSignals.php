<?php
/************************************************************************
 * vi: set sw=4 ts=4:
 *
 * This file is part of Extension 'EspoCRM Polling Signals'.
 *
 * 'EspoCRM Polling Signals' - Extension to EspoCRM, an Open Source CRM application.
 * Copyright (C) 2020 Hans Dijkema
 * Website: https://github.com/hdijkema/espocrm-pollingsignals
 *
 * 'EspoCRM Polling Signals' is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * EspoSignals is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EspoSignals. If not, see http://www.gnu.org/licenses/.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the
 * 'EspoCRM Polling Signals' phrase.
 ************************************************************************/

const APCU_PS_KEY = '__%_polling_signals_espocrm_%__';
const APCU_PS_SESSIONS = '__$_polling_signals_espocrm_sessions_%__';

class PollingSignals
{
   private $DEBUG = true;

   private function log($msg)
   {
      if ($this->DEBUG) { error_log($msg); }
   }

   private function checkAPCU()
   {
       $has_apcu = false;
       $apcu_exists = function_exists('apcu_enabled');
       if ($apcu_exists) {
          $apcu_enabled = apcu_enabled();
          if ($apcu_enabled) {
             $has_apcu = true;
          }
       }

       if (!$has_apcu) {
          throw 'PollingSignals requires PHP APCU';
       }
   }

   private function setSession($session_id)
   {
       $apcu_sessions = apcu_fetch(APCU_PS_SESSIONS);
       $apcu_sessions[$session_id] = true;
       apcu_store(APCU_PS_SESSIONS, $apcu_sessions, 3600);
   }

   private function clearSession($session_id)
   {
       $apcu_sessions = apcu_fetch(APCU_PS_SESSIONS);
       if (isset($apcu_sessions[$session_id])) {
          unset($apcu_sessions[$session_id]);
       }
       apcu_store(APCU_PS_SESSIONS, $apcu_sessions, 3600);
   }

   private function getSessions()
   {
       $apcu_sessions = apcu_fetch(APCU_PS_SESSIONS);
       $s = [];
       foreach($apcu_sessions as $session_id => $val) {
          array_push($s, $session_id);
       }
       return $s;
   }

   public function setPollingSignal($id, $session_id, $flag_value = false)
   {
       $this->checkAPCU();

       $this->setSession($session_id);

       $flag = $id . '_flagged';
       $apcu_sess = APCU_PS_KEY . '_' . $session_id;
 
       if (apcu_exists($apcu_sess)) {
          $signals = apcu_fetch($apcu_sess);
       } else {
          $signals = [];
       }

       $key = $session_id . '|' . $id;
       $flag_key = $session_id . '|' . $flag;
  
       $key_new = apcu_exists($key);
       $id_ok = apcu_store($key, true, 3600);
       $flag_ok = apcu_store($flag_key, $flag_value, 3600);

       $signals[$id] = true;
       apcu_store($apcu_sess, $signals, 3600);
  
       
       $this->log('PollingSignals: id ' . $id . ' apcu stored = ' . $id_ok . ' for session ' . $session_id);
       $this->log('PollingSignals: flagged = ' . $flag_value . ' for ' . $id . ' apcu stored = ' . $flag_ok . ' for session ' . $session_id);

       return $key_new;
   }

   public function clearPollingSignal($id, $session_id)
   {
       $this->checkAPCU();

       $flag = $id . '_flagged';
       $apcu_sess = APCU_PS_KEY . '_' . $session_id;

       $cleared = false;
       $key = $session_id . '|' . $id;
       $flag_key = $session_id . '|' . $flag;
       if (apcu_exists($key)) {
          apcu_delete($key);
          apcu_delete($flag_key);
          $signals = apcu_fetch($apcu_sess);
          $ns = [];
          foreach($signals as $s_id => $val) {
             if ($s_id != $id) {
               $ns[$s_id] = $val;
             }
          }
          if (count($ns) == 0) {
             $this->clearSession($session_id);
          }
          apcu_store($apcu_sess, $ns);
          $cleared = true;
       }

       return $cleared;
    }

    public function getFlaggedSignals($session_id)
    {
       $this->checkAPCU();

       $apcu_sess = APCU_PS_KEY . '_' . $session_id;
       $flagged = []; 

       if (apcu_exists($apcu_sess)) {
          $signals = apcu_fetch($apcu_sess);
       } else {
          $signals = [];
       }

       $sigs = [];
       foreach($signals as $id => $value) {
          array_push($sigs, $id);
       }
       $this->log('Signals for session_id = ' . $session_id . ': ' . json_encode($sigs));

       foreach($signals as $id => $value) {
          $key = $session_id . '|' . $id;
          if (apcu_exists($key)) {
             $flag = $id . '_flagged';
             $flag_key = $session_id . '|' . $flag;
             $is_flagged = apcu_fetch($flag_key);
             if ($is_flagged) {
                apcu_store($flag_key, false, 3600);
                array_push($flagged, $id);
             }
          }
       }

       $this->log('Flagged signals: ' . json_encode($flagged));

       return $flagged;
    }

    public function flagPollingSignal($id)
    {
       $this->checkAPCU();
       $session_ids = $this->getSessions();
       foreach($session_ids as $session_id) {
          $this->setPollingSignal($id, $session_id, true);
       }
    }
}

function createPollingSignals()
{
   return new PollingSignals();
}

?>
