/* vi: set sw=4 ts=4:  */
define(
	'pollingsignals:views/record/panels/autoupdate-relationship',
	[ 'views/record/panels/relationship' , 'pollingsignals:signals' ], 
	function (Dep, Signals) {

		return Dep.extend({
				topic: 'autoupdate',

				setup: function() {
					Dep.prototype.setup.call(this);
                    var signals = Signals;
                    var me = this;
                    signals.registerSignal(this, 
										   this.topic, this.model.entityType, this.model.id,
										   function() { me.collection.fetch(); }
										  );
				}
		});
     }
);

