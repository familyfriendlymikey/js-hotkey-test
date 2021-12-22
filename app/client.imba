let p = console.log

let last_pressed = "None"

tag app

	def handle_keypress e
		p e
		if e.shiftKey
			last_pressed = "Shift + {e.key}"
		else
			last_pressed = e.key

	def handle_shift_space
		last_pressed = "Mousetrap Shift Space"

	def render

		<self>

			css self
				w:100%
				d:flex fld:row jc:center ai:center

			css .left
				fl:1

			css .right
				fl:1
				ta:center

			<.left>
				<p> "Keypress"
				<input@keypress=handle_keypress>

				<p> "Mousetrap"
				<input@hotkey('shift+space').capture=handle_shift_space>

			<.right>
				last_pressed

imba.mount <app>
