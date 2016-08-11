'use strict';

window.SkillChecker = {
	'ディレイ': function() {}
}

window.Engine = {
	start: function() {
		console.log('Engine Start!!');
		this.observers = [];
		this.observeEnd();
		if (window.location.hash.indexOf('raid_multi') >= 0) {
			this._handle_raid_multi();
		} else {
			this._handle_raid();
		}
	},
	debug: function(msg) {
		window.dispatchEvent(new CustomEvent('_debug', {
			detail: arguments
		}))
	},
	isMultiRaid: function() {
		return window.location.hash.indexOf('raid_multi') >= 0;
	},
	getFreePotion: function() {
		if (this.isMultiRaid()) {
			return this.waitUntilVisible('....');
		} else {
			return Promise.resolve();
		}
	},
	FC: function() {},
	getTurnNum: function() {
		var className = '';
		var turn = $('.prt-turn-info .prt-number div');
		turn.each(function() {
			className = $(this).attr('class') || className;
		});
		if (!className) {
			return 0;
		}
		return Number(className.replace('num-turn', ''));
	},
	click: function(selector) {
		window.localStorage.setItem('button-selector', selector);
		var button = $(selector)
		if (button) {
			var e, o = $(document.documentElement).css('zoom'),
				btninfo = {
					x: 0x0,
					y: 0x0,
					w: 0x0,
					h: 0x0
				},
				a = button.parents();
			if (btninfo.w = button.innerWidth() * o, btninfo.h = button.innerHeight() * o, a.is(document.body))
				for (var s = button; s[0x0] != document.body; s = s.parent()) e = s.position(), btninfo.y = btninfo.y + e.top * o, btninfo.x = btninfo.x + e.left * o;

			var tx = Math.round(btninfo.x + Math.random() * btninfo.w),
			ty = Math.round(btninfo.y + Math.random() * btninfo.h),
			tpe = new MouseEvent('tap', {
				view: window,
				bubbles: true,
				clientX: tx,
				clientY: ty,
				cancelable: true
			});

			false != button.length && button[0].dispatchEvent(tpe);
		}
		this.debug('click:', selector);
	},
	eachWave: function(wave) {
		window.wave = wave;
		this.greenPotionCount = undefined;
		this.bluePotionCount = undefined;
		this.eventHealCount = undefined;
		this.eventReviveCount = undefined;
		if (this.turn === undefined) {
			this.eachTurn(0);
		}
	},
	'_handle_raid_multi': function() {

		console.log('inject complete!!');
		Promise.race([
			this.waitUntilVisible('div.prt-popup-header:contains("救援依頼")'),
			this.sleep(5)
		]).then(function() {
			this.click('.btn-usual-cancel');
			return this.sleep(3);
		}.bind(this)).then(function() {
			this.eachTurn(0);
		}.bind(this));
	},
	eachTurn: function(turn) {
		if (this.turn === turn) {
			return;
		}
		this.turn = turn;
		var currentWave = window.wave;
		var usespecial = "true";
		//this.sleep(3);
		var fcREloadint;

		this.waitUntilVisible('.btn-attack-start.display-on').then(function() {
			return this.healIfInjured();
		}.bind(this)).then(function() {
			if (this.isBossWave()) {
				return this.summonIfPossible();
			} else {
				return Promise.resolve();
			}
		}.bind(this)).then(function() {
			if (this.isBossWave() || (window.localStorage.getItem('only-bosswave-skill') !== 'true')) {
				return this.castIfAvailable();
			} else {
				return Promise.resolve();
			}
		}.bind(this)).then(function() {
			var allFull = 0;
			if ($(".prt-member .lis-character0 .prt-gauge-special-inner").attr('style').split(':')[1].replace(/%;/, "") >= 100) {
				if ($(".prt-member .lis-character1 .prt-gauge-special-inner").attr('style').split(':')[1].replace(/%;/, "") >= 90) {
					if ($(".prt-member .lis-character2 .prt-gauge-special-inner").attr('style').split(':')[1].replace(/%;/, "") >= 80) {
						if ($(".prt-member .lis-character3 .prt-gauge-special-inner").attr('style').split(':')[1].replace(/%;/, "") >= 70) {
							allFull = 1
						}
					}
				}
			}

			if (window.localStorage.getItem('auto-ougi') === 'true') {
				allFull = 1
			}

			if (!this.isBossWave() && window.localStorage.getItem('only-bosswave-ougi') === 'true') {
				allFull = 0
			}

			if (allFull == 1) {
				if ($(".btn-lock").hasClass("lock1")) {
					this.click(".btn-lock");
				}
			} else {
				if ($(".btn-lock").hasClass("lock0")) {
					this.click(".btn-lock");
				}
			}

			this.attack();
			return this.sleep(3);
		}.bind(this)).then(function() {
			return this.waitUntilVisible('.btn-attack-start.display-on');
		}.bind(this)).then(function() {
			if (window.wave !== currentWave) {
				return Promise.resolve();
			}
			this.eachTurn(this.getTurnNum());
		}.bind(this));
	},
	observeEnd: function() {
		var self = this;
		var observer = new MutationObserver(function(mutations) {
			if ($('.btn-result').is(':visible')) {
				this.click('.btn-result');
			}
		}.bind(this));

		observer.observe(document.querySelector('.prt-command-end'), {
			childList: true,
			subtree: true,
			attributes: true,
			characterData: false
		});
		this.observers.push(observer);
	},
	observePop: function() {
		var self = this;
		var observer = new MutationObserver(function(mutations) {
			if ($('.btn-usual-ok:visible').length) {
				this.click('.btn-usual-ok');
				observer.disconnect();
			} else if ($('.btn-usual-cancel:visible').length) {
				this.click('.btn-usual-cancel');
				observer.disconnect();
			} else if ($('.btn-usual-close:visible').length) {
				this.click('.btn-usual-close');
				observer.disconnect();
			}
		}.bind(this));

		observer.observe(document.querySelector('#pop'), {
			childList: true,
			subtree: true,
			attributes: true,
			characterData: false
		});
		this.observers.push(observer);
	},
	observeTurnInfo: function() {
		var self = this;
		var observer = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (mutation.attributeName === 'class' && $('.prt-turn-info.anim-on').length) {
					var turn = Number($('.prt-turn-info .prt-number').children().eq(0).attr('class').replace('num-turn', ''));
					this.eachTurn(turn);
				}
			}, this);
		}.bind(this));

		observer.observe(document.querySelector('.prt-turn-info'), {
			childList: true,
			subtree: true,
			attributes: true,
			characterData: false
		});
		this.observers.push(observer);
	},
	'_handle_raid': function() {
		this.observeWaveInfo();
		this.observeEnd();
		// this.observePop();
	},
	observeWaveInfo: function() {
		var self = this;
		var observer = new MutationObserver(function(mutations) {
			this.waitUntilVisible('.btn-attack-start.display-on').then(function() {
				this.eachWave(Number($('.txt-info-num:visible').children(':first').attr('class').replace('num-info', '')));
			}.bind(this));
		}.bind(this));

		observer.observe(document.querySelector('.prt-battle-num'), {
			childList: true,
			subtree: true,
			attributes: true,
			characterData: false
		});
		this.observers.push(observer);
	},
	waitUntilVisible: function(selector) {
		this.debug('waiting visible:' + selector);
		return new Promise(function(resolve) {
			if ($(selector).is(":visible")) {
				resolve();
				return;
			}
			this.visibleObserver && this.visibleObserver.disconnect();
			var self = this;
			var observer = new MutationObserver(function(mutations) {
				mutations.forEach(function(mutation) {
					if ($(selector).is(":visible")) {
						this.visibleObserver && this.visibleObserver.disconnect();
						resolve();
					}
				}, this);
			}.bind(this));

			observer.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: true,
				characterData: false
			});
			this.visibleObserver = observer;
		}.bind(this));
	},
	waitUntilInvisible: function(selector) {
		return new Promise(function(resolve) {
			if (!$(selector).is(":visible")) {
				resolve();
				return;
			}
			this.invisibleObserver && this.invisibleObserver.disconnect();
			var self = this;
			var observer = new MutationObserver(function(mutations) {
				mutations.forEach(function(mutation) {
					if (!$(selector).is(":visible")) {
						this.invisibleObserver && this.invisibleObserver.disconnect();
						resolve();
					}
				}, this);
			}.bind(this));

			observer.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: true,
				characterData: false
			});
			this.invisibleObserver = observer;
		}.bind(this));
	},
	waitOnce: function(selector) {
		this.debug('waiting:' + selector);
		return new Promise(function(resolve) {
			this.onceObserver && this.onceObserver.disconnect();
			var self = this;
			var observer = new MutationObserver(function(mutations) {
				mutations.forEach(function(mutation) {
					if ($(selector).length || document.querySelector(selector)) {
						this.onceObserver && this.onceObserver.disconnect();
						resolve();
					}
				}, this);
			}.bind(this));

			observer.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: true,
				characterData: false
			});
			this.onceObserver = observer;
		}.bind(this));
	},
	change: function(callback, dom) {
		this.observer && this.observer.disconnect();
		var self = this;
		var observer = new MutationObserver(function(mutations) {
			callback(mutations);
		}.bind(this));

		observer.observe(dom || document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			characterData: false
		});
		this.observer = observer;
	},
	stop: function() {
		this.observer && this.observer.disconnect();
	},
	isBossWave: function() {
		return (window.location.hash.indexOf('raid_multi') >= 0) ||
			($('.txt-info-num:visible').children(':first').attr('class') ===
				$('.txt-info-num:visible').children(':last').attr('class'));
	},
	/**
	 * Return the npc id who is injured.
	 */
	isInjured: function(index) {
		var injured = -1;
		var $npchp = $('.prt-gauge-hp:visible').eq(index);
		var total = $npchp.width();
		var current = $npchp.children('.prt-gauge-hp-inner').width();
		if (current / total < 0.6 && !this.hasBarrier(index)) {
			return true;
		}
		return false;
	},
	hasBarrier: function(index) {
		if ($('.prt-status.prt-condition[pos="' + index + '"]').find('[data-status="1003"]').length) {
			return true;
		} else {
			return false;
		}
	},
	actionable: function() {
		return this.waitUntilVisible('.btn-attack-start.display-on').then(function() {
			this.debug('ready for next action');
			return Promise.resolve();
		}.bind(this));
	},
	healIfInjured: function() {
		return this.heal(0).then(function() {
			return this.heal(1);
		}.bind(this)).then(function() {
			return this.heal(2);
		}.bind(this)).then(function() {
			return this.heal(3);
		}.bind(this));
	},
	castIfAvailable: function() {
		if (window.localStorage.getItem('normal-attack-only') === 'true') {
			return Promise.resolve();
		}
		return this.castAllSkill(0).then(function() {
			return this.castAllSkill(1);
		}.bind(this)).then(function() {
			return this.castAllSkill(2);
		}.bind(this)).then(function() {
			return this.castAllSkill(3);
		}.bind(this));
	},
	summonIfPossible: function() {
		if ($('.summon-on').length && window.localStorage.getItem('auto-summon') === 'true') {
			return this.summon()
		} else {
			Promise.resolve();
		}
	},
	summon: function() {
		this.click('.summon-on');
		return this.waitOnce('.summon-show').then(function() {
			return this.sleep(1.5);
		}.bind(this)).then(function() {
			this.click('.lis-summon.on.btn-summon-available:first');
			return this.waitUntilVisible('.btn-summon-use');
		}.bind(this)).then(function() {
			this.click('.btn-summon-use');
			return this.sleep(1.5);
		}.bind(this)).then(function() {
			return this.waitUntilVisible('.btn-attack-start.display-on');
		}.bind(this));
	},
	getSkillPreference: function(skill) {
		return window.localStorage.getItem(skill) !== 'false';
	},
	notFirstTurnSkill: function(skillName) {
		var set = ['ディレイ', 'ヴォーパルレイジ'];
		return set.some(function(match) {
			return (skillName.indexOf(match) >= 0);
		});
	},
	cast: function(skillId) {
		var skillName = $('.lis-ability:visible:eq(' + skillId + ')').find('[ability-name]').attr('ability-name');
		if ((skillName && (this.getTurnNum() === 0 && this.notFirstTurnSkill(skillName))) ||
			this.getSkillPreference(skillName) === false ||
			!$('.lis-ability:visible:eq(' + skillId + ')').is('.btn-ability-available')) {
			return Promise.resolve();
		} else {
			this.click('.lis-ability:visible:eq(' + skillId + ')');
			return this.actionable();
			// return this.waitUntilVisible('.prt-log.log-ability').then(function() {
			//   return this.actionable();
			// }.bind(this));
		}
	},
	castAllSkill: function(npcId) {
		var self = this;
		var $states = $('.btn-command-character[pos="' + npcId + '"]:visible .lis-ability-state');
		var available = false;
		$states.each(function(index) {
			var skillName = $('.prt-ability-list').eq(npcId).find('[ability-name]').eq(index).attr('ability-name');
			if (self.getSkillPreference(skillName) === false ||
				self.getTurnNum() === 0 && skillName && skillName.indexOf('ディレイ') >= 0) {
				return true;
			}
			if ($(this).attr('state') === '2') {
				available = true;
				return false;
			}
		});
		if (!available) {
			return Promise.resolve();
		}
		this.click('.btn-command-character[pos="' + npcId + '"]:visible');
		return this.sleep(1).then(function() {
			return this.cast(0);
		}.bind(this)).then(function() {
			return this.cast(1);
		}.bind(this)).then(function() {
			return this.cast(2);
		}.bind(this)).then(function() {
			return this.cast(3);
		}.bind(this)).then(function() {
			this.click('.btn-command-back.display-on');
			return this.waitUntilInvisible('.prt-command-chara[pos="' + (npcId + 1) + '"]')
		}.bind(this));
	},
	waitForTransitionend: function(selector) {
		return new Promise(function(resolve) {
			$(selector).one('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function() {
				resolve();
			});
		});
	},
	noPotion: function() {
		return this.greenPotionCount === 0 && this.bluePotionCount === 0 &&
			(window.localStorage.getItem('use-event-potion') !== 'true' ||
				this.eventPotionCount === 0) &&
			(window.localStorage.getItem('use-event-revive') !== 'true' ||
				this.eventReviveCount === 0);
	},
	heal: function(index) {
		if (window.localStorage.getItem('auto-heal') !== 'true') {
			return Promise.resolve();
		}

		if (!this.isInjured(index) ||
			this.noPotion()) {
			return Promise.resolve();
		}
		this.click('.btn-temporary');
		return this.waitOnce('.pop-raid-item.pop-show').then(function() {
			var greenPotionCount = parseInt($('.having-num').eq(0).text());
			var bluePotionCount = parseInt($('.having-num').eq(1).text());
			var eventPotionCount = parseInt($('.having-num').eq(3).text() || 0);
			var eventReviveCount = parseInt($('.having-num').eq(5).text() || 0);
			this.greenPotionCount = greenPotionCount;
			this.bluePotionCount = bluePotionCount;
			this.eventReviveCount = eventReviveCount;
			this.eventPotionCount = eventPotionCount;



			if (greenPotionCount > 0) {
				this.click('.btn-temporary-small');
				return this.waitOnce('div.prt-popup-header:contains("アイテムを使用")').then(function() {
					this.click('.btn-command-character:visible:eq(' + index + ')');
					this.greenPotionCount--;
					return this.sleep(3);
				}.bind(this)).then(function() {
					return this.waitUntilVisible('.btn-attack-start.display-on');
				}.bind(this));
			} else if (bluePotionCount > 0) {
				this.click('.item-large.btn-temporary-large');
				return this.waitOnce('div.prt-popup-header:contains("アイテムを使用")').then(function() {
					this.click('.btn-usual-use');
					this.bluePotionCount--;
					return this.sleep(3);
				}.bind(this)).then(function() {
					return this.waitUntilVisible('.btn-attack-start.display-on');
				}.bind(this));
			} else if (window.localStorage.getItem('use-event-potion') === 'true' &&
				eventPotionCount > 0) {
				this.click('.lis-item.btn-event-item[item-id="1"]');
				return this.waitOnce('div.prt-popup-header:contains("アイテムを使用")').then(function() {
					this.click('.btn-usual-ok');
					this.eventPotionCount--;
					return this.sleep(3);
				}.bind(this)).then(function() {
					return this.waitUntilVisible('.btn-attack-start.display-on');
				}.bind(this));
			} else if (window.localStorage.getItem('use-event-revive') === 'true' &&
				eventReviveCount > 0) {
				this.click('.lis-item.btn-event-item[item-id="3"]');
				return this.waitOnce('div.prt-popup-header:contains("アイテムを使用")').then(function() {
					this.click('.btn-usual-ok');
					this.eventPotionCount--;
					return this.sleep(3);
				}.bind(this)).then(function() {
					return this.waitUntilVisible('.btn-attack-start.display-on');
				}.bind(this));
			} else {
				this.click('.pop-raid-item .btn-usual-cancel');
				return this.waitUntilInvisible('.pop-raid-item');
			}
		}.bind(this));
	},
	attack: function() {
		this.click('.btn-attack-start.display-on');
		this.debug('attack, ' + this.turn);
	},
	sleep: function(sec) {
		return new Promise(function(resolve) {
			setTimeout(function() {
				resolve();
			}, sec * 1000)
		}.bind(this));
	}
};

window.Engine.start();