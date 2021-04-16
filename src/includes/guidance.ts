import {
	window,
	commands,
	ExtensionContext
} from "vscode";
import { State }                      from "./guide/base/base";
import { MultiStepInput }             from "./utils/multiStepInput";
import { GuideFactory }               from "./guide/factory/base";

export async function guidance(context: ExtensionContext) {
	const state = {
		title:     "Wallpaper Setting",
		resultSet: {}
	} as Partial<State>;

	try {
		let menu = GuideFactory.create("StartMenuGuide", state, context);
		await MultiStepInput.run((input: MultiStepInput) => menu.start(input));
	} catch (e) {
		window.showWarningMessage(e.message);
	}

	if (state.message && state.message.length > 0) {
		window.showInformationMessage(state.message);
	}

	if (state.reload) {
		commands.executeCommand("workbench.action.reloadWindow");
	}
}