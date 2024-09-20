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

require_once('PollingSignals.php');

$obj = (object)[];

if (isset($_GET['id']) && isset($_GET['session_id'])) {
	$obj->ok = true;
	$id = $_GET['id'];
    $session_id = $_GET['session_id'];

    error_log('RegisterSignal: id = ' . $id . ', session_id = ' . $session_id);

    $ps = new PollingSignals();
    $key_new = $ps->setPollingSignal($id, $session_id);

	if ($key_new) {
		$obj->status = 'new';
	} else {
		$obj->status = 'overwritten';
	}
} else {
    error_log('RegisterSignal: no id or session_id given');
	$obj->ok = false;
}

$json = json_encode($obj);

echo $json;
?>
