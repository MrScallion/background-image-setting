import * as assert          from "assert";
import * as sinon           from "sinon";
import * as path            from "path";
import * as testTarget      from "../../../includes/guide/begin";
import { ExtensionContext } from "vscode";
import { MultiStepInput }   from "../../../includes/utils/multiStepInput";
import { State }            from "../../../includes/guide/base/base";
import { ExtensionSetting } from "../../../includes/settings/extension";
import { VSCodePreset }     from "../../../includes/utils/base/vscodePreset";
import { MainWallpaper }    from "../../../includes/wallpaper/main";

suite('Scenario - Setup Image Test Suite', async () => {
	const stateCreater  = () => ({ title: "Test Suite", resultSet: {} } as State);
	const items         = {
		Setup:        VSCodePreset.create(VSCodePreset.Icons.fileMedia,    "Setup Image", "Set an image to wallpaper."),
	};

	test('Begin -> Image -> Opacity', async () => {
		const filePath      = path.join(__dirname, "testDir", "test.png");
		const opacity       = "0.55";
		const inputStub     = sinon.stub(MultiStepInput.prototype,        "showInputBox");
		const pickStub      = sinon.stub(MultiStepInput.prototype,        "showQuickPick");
		const wallpaperStub = sinon.stub(MainWallpaper.prototype,         "install");
		const context       = { asAbsolutePath: (dir: string) => path.join(__dirname, "..", "..", "..", "..", "..", dir) } as ExtensionContext;

		pickStub.resolves(items.Setup);
		inputStub.onFirstCall().resolves(filePath);
		inputStub.onSecondCall().resolves(opacity);
		await MultiStepInput.run((input: MultiStepInput) => new testTarget.StartMenuGuide(stateCreater(), context).start(input));

		const setting       = new ExtensionSetting();
		assert.strictEqual(setting.getItemValue(ExtensionSetting.propertyIds.filePath), filePath);
		assert.strictEqual(setting.getItemValue(ExtensionSetting.propertyIds.opacity),  Number(opacity));
		assert.strictEqual(pickStub.calledOnce,                                         true);
		assert.strictEqual(inputStub.calledTwice,                                       true);
		assert.strictEqual(wallpaperStub.calledOnce,                                    true);

		inputStub.restore();
		pickStub.restore();
		wallpaperStub.restore();

		await setting.uninstall();
	}).timeout(30 * 1000);

	test('Begin -> Image - Advanced Mode', async () => {
		const filePath      = path.join(__dirname, "testDir", "test.png");
		const opacity       = "0.75";
		const inputStub     = sinon.stub(MultiStepInput.prototype,        "showInputBox");
		const pickStub      = sinon.stub(MultiStepInput.prototype,        "showQuickPick");
		const wallpaperStub = sinon.stub(MainWallpaper.prototype,         "install");
		const context       = { asAbsolutePath: (dir: string) => path.join(__dirname, "..", "..", "..", "..", "..", dir) } as ExtensionContext;

		await new ExtensionSetting().set(ExtensionSetting.propertyIds.advancedMode, true);

		pickStub.resolves(items.Setup);
		inputStub.onFirstCall().resolves(filePath);
		await MultiStepInput.run((input: MultiStepInput) => new testTarget.StartMenuGuide(stateCreater(), context).start(input));

		const setting       = new ExtensionSetting();
		assert.strictEqual(setting.getItemValue(ExtensionSetting.propertyIds.filePath), filePath);
		assert.strictEqual(setting.getItemValue(ExtensionSetting.propertyIds.opacity),  Number(opacity));
		assert.strictEqual(pickStub.calledOnce,                                         true);
		assert.strictEqual(wallpaperStub.calledOnce,                                    true);

		inputStub.restore();
		pickStub.restore();
		wallpaperStub.restore();

		await setting.uninstall();
	}).timeout(30 * 1000);
});
