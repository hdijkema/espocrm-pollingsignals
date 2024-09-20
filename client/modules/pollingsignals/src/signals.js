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

define('pollingsignals:signals', [ ], function () {

	var flagged_ids = [];
	var interval = 2000;	// 2 seconds
    var alive_info = 10;	// every tenth call we signal that we're alive. 

	var _check_id;

	var Signals;
    var Espo;

   	Signals = {
   	    
		_initialized: false,

		_internalDeregSig: function(panel, topic, entityType, id) { },
		_internalRegSig: function(panel, topic, entityType, id) { },

		_deregisterSignal: function(panel, topic, entityType, id) { 
			this._internalDeregSig(panel, topic, entityType, id); 
		},

		_init: function(panel) {
			if (this._initialized) return;

			this._initialized = true;

            if (window.hd_session_id) {
               this._session_id = window.hd_session_id;
            } else {
               this._session_id = "id" + Math.random().toString(16).slice(2);
               window.hd_session_id = this._session_id;
            }

            Espo = window.Espo;

    		if (!panel.getConfig().get('useWebSocket')) {
				// If we can't use websockets, we use our own polling mechanism.

				if (typeof window.hd_signals === 'undefined') {
					var tick = 100; // 100 ms
					window.hd_signals = [];
					window.setInterval(
							function() {
								window.hd_signals.forEach(
									function(obj, idx) { 
										obj.cb(tick); 
									}
								);
							},
							tick
						);
                    let alive_count = 0;
                    let alive_info_count = alive_info;
					window.setInterval(
						function() {
                            if (alive_info_count > 0) {
                               alive_info_count -= 1;
                            } else {
                               alive_info_count = alive_info;
                               alive_count += 1;
                               console.log('Still checking for signals. Number of registered signals: ', window.hd_signals.length, ' alive count: ', alive_count);
                            }
							if (window.hd_signals.length > 0) {
                			    let url = 'PollingSignals/FlaggedSignals.php?session_id=' + this._session_id;
								Espo.Ajax
                                    .getRequest(url)
                                    .then(data => {
                                        if (data.flagged.length > 0) {
                                           console.log('flagged data: ', data.flagged);
                                        }
										data.flagged.forEach(function(id, idx) {
                                       		 let applies = [];
                                             window.hd_signals.forEach(
                                                  function(obj, idx) {
                                                     if (obj.flag == id) {
                                                        applies.push(obj);
                                                     }
                                                  }
                                            );
                                            let f_obj = {
                                                    flag_id: id,
                                                    objects: applies
                                            };
											flagged_ids.push(f_obj);
										});
                                    });
							}
						}.bind(this),
						interval
					);
				}

	    		_checkId = function(id, obj, callback) {
					flagged_ids = flagged_ids.filter(function(flagged_id, idx, arr) {
                        var f_id = flagged_id.flag_id;
						if (id == f_id) { 
							callback();
                            var objects = flagged_id.objects.filter(function(a_obj, idx, arr) {
                                return a_obj != obj;
                            });
                            flagged_id.objects = objects;
                            return objects.length > 0;
						} else { 
							return true; 
						}
					});
				};

				this._internalDeregSig = function(panel, topic, entityType, id) {
					var flag_id = topic + '.' + entityType + '.' + id;

				    let url = 'PollingSignals/DeregisterSignal.php?id=' + flag_id + '&session_id=' + this._session_id;
                    Espo.Ajax
                        .getRequest(url)
                        .then(data => { 
                            // does nothing
                        });

					window.hd_signals = window.hd_signals.filter(function(obj, idx) {
																	var id = obj.flag;
																	return flag_id != id; 
																});
				};

				this._internalRegSig = function (panel, topic, entityType, id, callback, poll_seconds = 2) {
					var flag_id = topic + '.' + entityType + '.' + id;

                    let has_id = false;
                    window.hd_signals.forEach(function(obj) {
                        if (obj.flag == flag_id) { has_id = true; }
                    });

                    if (has_id) { 
                       this._deregisterSignal(panel, topic, entityType, id);
                    }

               		let url = 'PollingSignals/RegisterSignal.php?id=' + flag_id + '&session_id=' + this._session_id;
                    Espo.Ajax
                        .getRequest(url)
                        .then(data => {
							let seconds = poll_seconds;
							if (poll_seconds < 1) { seconds = 1; }
							let _mseconds = seconds * 1000;
							let _ticks = 0;
							let obj = {
								flag: flag_id,
								cb: function(ms) {
										_ticks += ms;
										if (_ticks >= _mseconds) {
											_ticks = 0;
											_checkId(flag_id, obj, callback);
										}
									}
							};
							window.hd_signals.push(obj);
                        });

					let me = this;
					panel.once('remove', function() { 
                        console.log('Removing previous registered signal for topic ', topic, ' entity type ', entityType, ' and id ', id);
						me._deregisterSignal(panel, topic, entityType, id);
					});
				};
			} else {
				// Websocket implementation

				this._internalDeregSig = function(panel, topic, entityType, id) {
					var flag_id = topic + '.' + entityType + '.' + id;
					panel.getHelper().webSocketManager.unsubscribe(flag_id);
				};

                let me = this;
				this._internalRegSig = function(panel, topic, entityType, id, callback, poll_seconds = 2) {
					var flag_id = topic + '.' + entityType + '.' + id;
					panel.streamUpdateWebSocketTopic = flag_id;
					panel.getHelper().webSocketManager.subscribe(flag_id, 
															 	function(t, data) {
																	callback();
															 	}
																);
					panel.once('remove', function() {
						me._deregisterSignal(panel, topic, entityType, id);
					});
				};
			}

		},

		registerSignal: function(panel, topic, entityType, id, poll_secs = 1) {
			console.log('registerSignal: ' + topic + '.' + entityType + '.' + id);
			this._init(panel);
			this._internalRegSig(panel, topic, entityType, id, poll_secs);
		}
    };
    
	return Signals;
});

