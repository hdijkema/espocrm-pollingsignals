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

namespace Espo\Modules\PollingSignals\Core\Formula\Functions;

use \Espo\ORM\Entity;
use \Espo\Core\Exceptions\Error;

require_once(__DIR__ . '/../../../../../../../public/api/v1/PollingSignals/PollingSignals.php');

class SignalType extends \Espo\Core\Formula\Functions\Base
{

    private $ps = null;

    private function initPollingSignals()
    {
       if ($this->ps == null) { 
           $this->ps = createPollingSignals();
       }
    }

    protected function init()
    {
        $this->addDependency('config');
        $this->initPollingSignals();
    }

    public function process(\StdClass $item)
    {
        $this->initPollingSignals();

        if (!property_exists($item, 'value')) {
            return true;
        }

        if (!is_array($item->value)) {
            throw new Error('Value for \'Signal\' item is not array.');
        }

        if (count($item->value) < 3) {
             throw new Error('Bad value for \'Signal\' item.');
        }

		$topic = $this->evaluate($item->value[0]);
		$entityType = $this->evaluate($item->value[1]);
		$id = $this->evaluate($item->value[2]);

		$flag_id = "$topic.$entityType.$id";
        
		$config = $this->getInjection('config');
		$web_socket = $config->get('useWebSocket');

		if ($web_socket) {
			$data = (object) [ 'flag_id' => $flag_id ];
			$this->getInjection('webSocketSubmission')->submit($flag_id, null, $data);
		} else {
            $this->ps->flagPollingSignal($flag_id);
		}

		return $flag_id;
    }
}
