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
	var interval = 1000;

	var _check_id;

	var Signals;
    var Espo;

    console.log(window.Espo);

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
					window.setInterval(
						function() {
							if (window.hd_signals.length > 0) {
            					/*$.ajax({
                						url: '/api/v1/PollingSignals/FlaggedSignals.php',
                						dataType: 'json',
                						local: true,
                						success: function(data) {
											data.flagged.forEach(function(id, idx) {
                                                var applies = [];
                                                window.hd_signals.forEach(
                                                   function(obj, idx) {
                                                      if (obj.flag == id) {
                                                         applies.push(obj);
                                                      }
                                                   }
                                                );
                                                var f_obj = {
                                                    flag_id: id,
                                                    objects: applies
                                                };
												flagged_ids.push(f_obj);
											});
                						}
            						});
                                **/
                			    let url = 'PollingSignals/FlaggedSignals.php';
								Espo.Ajax
                                    .getRequest(url)
                                    .then(data => {
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
						},
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
                    
					/*$.ajax({
						url: '/api/v1/PollingSignals/DeregisterSignal.php?id=' + flag_id,
						dataType: 'json',
						local: true,
						success: function(data) {
							// does nothing
						}
					});*/

				    let url = 'PollingSignals/DeregisterSignal.php?id=' + flag_id;
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

				this._internalRegSig = function (panel, topic, entityType, id, callback, poll_seconds = 1) {
					var flag_id = topic + '.' + entityType + '.' + id;
					/*$.ajax({
               			url: '/api/v1/PollingSignals/RegisterSignal.php?id=' + flag_id,
               			dataType: 'json',
               			local: true,
               			success: function(data) {
							var seconds = poll_seconds;
							if (poll_seconds < 1) { seconds = 1; }
							var _mseconds = seconds * 1000;
							var _ticks = 0;
							var obj = {
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
						}
					});*/
                    
               		let url = 'PollingSignals/RegisterSignal.php?id=' + flag_id;
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

					var me = this;
					panel.once('remove', function() { 
						me._deregisterSignal(panel, topic, entityType, id);
					});
				};
			} else {
				// Websocket implementation

				this._internalDeregSig = function(panel, topic, entityType, id) {
					var flag_id = topic + '.' + entityType + '.' + id;
					panel.getHelper().webSocketManager.unsubscribe(flag_id);
				};

				this._internalRegSig = function(panel, topic, entityType, id, callback, poll_seconds = 1) {
					var flag_id = topic + '.' + entityType + '.' + id;
					panel.streamUpdateWebSocketTopic = flag_id;
					panel.getHelper().webSocketManager.subscribe(flag_id, 
															 	function(t, data) {
																	callback();
															 	}
																);
					panel.once('remove', function() {
						this._deregisterSignal(panel, topic, entityType, id);
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

