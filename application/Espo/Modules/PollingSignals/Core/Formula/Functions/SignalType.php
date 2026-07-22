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

use Espo\Core\Exceptions\Error;
use Espo\Core\Formula\EvaluatedArgumentList;
use Espo\Core\Formula\Func;
use Espo\Core\Utils\Config;
use Espo\Core\WebSocket\Submission as WebSocketSubmission;

require_once(__DIR__ . '/../../../../../../../public/api/v1/PollingSignals/PollingSignals.php');

class SignalType implements Func
{
    private ?\PollingSignals $pollingSignals = null;

    public function __construct(
        private Config $config,
        private WebSocketSubmission $webSocketSubmission
    ) {}

    private function getPollingSignals(): \PollingSignals
    {
        if ($this->pollingSignals === null) {
            $this->pollingSignals = createPollingSignals();
        }

        return $this->pollingSignals;
    }

    public function process(EvaluatedArgumentList $arguments): mixed
    {
        if (count($arguments) === 0) {
            return true;
        }

        if (count($arguments) < 3) {
            throw new Error('Bad value for \'Signal\' item.');
        }

        $topic = $arguments[0];
        $entityType = $arguments[1];
        $id = $arguments[2];

        $flagId = "$topic.$entityType.$id";

        if ($this->config->get('useWebSocket')) {
            $data = (object) ['flag_id' => $flagId];
            $this->webSocketSubmission->submit($flagId, null, $data);
        } else {
            $this->getPollingSignals()->flagPollingSignal($flagId);
        }

        return $flagId;
    }
}
