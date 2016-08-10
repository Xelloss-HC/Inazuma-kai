var button = $(window.localStorage.getItem('button-selector'));

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

tx = Math.round(btninfo.x + Math.random() * btninfo.w);
ty = Math.round(btninfo.y + Math.random() * btninfo.h);
tpe = new MouseEvent('tap', {
	view: window,
	bubbles: true,
	clientX: tx,
	clientY: ty,
	cancelable: true
});

false != button.length && button[0].dispatchEvent(tpe);