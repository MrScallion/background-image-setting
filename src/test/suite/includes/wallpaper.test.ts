import * as assert                    from "assert";
import * as path            from "path";
import { pathToFileURL }    from "url";
import * as fs              from "fs";
import * as sinon           from "sinon";
import * as testTarget      from "../../../includes/wallpaper/main";
import * as testTargetPE    from "../../../includes/wallpaper/processExplorer";
import { ExtensionSetting } from "../../../includes/settings/extension";
import { ContextManager }   from "../../../includes/utils/base/context";
import * as Constant        from "../../../includes/constant";
import { Optional }         from "../../../includes/utils/base/optional";

suite('Wallpaper Test Suite', async () => {
	const installLocation  = path.dirname(Optional.ofNullable(require.main?.filename).orElseThrow(new Error()));
	const installFileName  = "bootstrap-window.js";
	const installFilePath  = path.join(installLocation, installFileName);
	const extensionKey     = "wallpaper-setting";

	test('isInstall', async () => {
		const setting = new ExtensionSetting();
		const fsStub  = sinon.stub(fs, "readFileSync");
		const ctxStub = sinon.stub(ContextManager, "version").value("9.9.9");

		fsStub.withArgs(installFilePath).returns(
			"/*bootstrap-window.js - Data*/"
		);
		let instance  = new testTarget.MainWallpaper(installFilePath, setting, extensionKey);
		assert.strictEqual(instance.isInstall, false);

		fsStub.withArgs(installFilePath).returns(
`/* bootstrap-window.js - Data */
/*${extensionKey}-start*/
/*${extensionKey}.ver.${ContextManager.version}*/
/*${extensionKey}-end*/`
		);

		instance      = new testTarget.MainWallpaper(installFilePath, setting, extensionKey);
		assert.strictEqual(instance.isInstall, true);
		fsStub.restore();
		ctxStub.restore();
	}).timeout(30 * 1000);

	test('isReady and isAutoSet', async () => {
		const fsStub        = sinon.stub(fs, "readFileSync")
		fsStub.withArgs(installFilePath).returns(
			"/*bootstrap-window.js - Data*/"
		);
		const setupInstance = new ExtensionSetting();
		let   instance      = new testTarget.MainWallpaper(installFilePath, new ExtensionSetting(), extensionKey);

		assert.strictEqual(instance.isReady,   undefined);
		assert.strictEqual(instance.isAutoSet, undefined);

		await setupInstance.setItemValue(ExtensionSetting.propertyIds.filePath, path.join(__dirname, "testDir", "test.png"));
		instance            = new testTarget.MainWallpaper(installFilePath, new ExtensionSetting(), extensionKey);
		if (instance.isReady) {
			assert.strictEqual(instance.isReady.image, true);
			assert.strictEqual(instance.isReady.slide, false);
			assert.strictEqual(instance.isAutoSet,     Constant.types.wallpaper.image);
		} else {
			assert.fail();
		}
		await setupInstance.uninstall();

		await setupInstance.setItemValue(ExtensionSetting.propertyIds.slideFilePaths, [path.join(__dirname, "testDir", "test.png")]);
		instance            = new testTarget.MainWallpaper(installFilePath, new ExtensionSetting(), extensionKey);
		if (instance.isReady) {
			assert.strictEqual(instance.isReady.image, false);
			assert.strictEqual(instance.isReady.slide, true);
			assert.strictEqual(instance.isAutoSet,     Constant.types.wallpaper.slide);
		} else {
			assert.fail();
		}

		await setupInstance.setItemValue(ExtensionSetting.propertyIds.filePath, path.join(__dirname, "testDir", "test.png"));
		instance            = new testTarget.MainWallpaper(installFilePath, new ExtensionSetting(), extensionKey);
		if (instance.isReady) {
			assert.strictEqual(instance.isReady.image, true);
			assert.strictEqual(instance.isReady.slide, true);
			assert.strictEqual(instance.isAutoSet,     undefined);
		} else {
			assert.fail();
		}
		await setupInstance.uninstall();

		fsStub.restore();
	}).timeout(30 * 1000);

	test('install - Extension Setting', async () => {
		const ctxStub       = sinon.stub(ContextManager, "version").value("9.9.9");
		const filePath      = path.join(__dirname, "testDir", "test.png");
		const opacity       = 0.55;
		const writeData     = `/*bootstrap-window.js - Data*/
/*${extensionKey}-start*/
/*${extensionKey}.ver.${ContextManager.version}*/
document.addEventListener('DOMContentLoaded', () => {const style=document.createElement("style");style.appendChild(document.createTextNode("body > div {background-color:transparent !important;} body {background-image:url('vscode-file://vscode-app${pathToFileURL(filePath).pathname}');opacity:${opacity};background-size:cover;background-position:center;background-repeat:no-repeat;}"));document.head.appendChild(style);});
/*${extensionKey}-end*/`;

		const setupInstance = new ExtensionSetting();
		const fsReaderStub  = sinon.stub(fs, "readFileSync");
		const fsWriterMock  = sinon.mock(fs);

		fsReaderStub.withArgs(installFilePath).returns(`/*bootstrap-window.js - Data*/
`);
		fsWriterMock.expects("writeFileSync").withArgs(path.resolve(installFilePath), writeData);

		await setupInstance.setItemValue(ExtensionSetting.propertyIds.filePath, filePath);
		await setupInstance.setItemValue(ExtensionSetting.propertyIds.opacity,  opacity);
		new testTarget.MainWallpaper(installFilePath, new ExtensionSetting(), extensionKey).install();

		fsReaderStub.restore();
		fsWriterMock.restore();
		await setupInstance.uninstall();
		ctxStub.restore();
	}).timeout(30 * 1000);

	test('install - Advanced', async () => {
		const ctxStub       = sinon.stub(ContextManager, "version").value("9.9.9");
		const filePath      = path.join(__dirname, "testDir", "test.png");
		const opacity       = 0.55;
		const readData      = `test.png Data`;
		const writeData     = `/*bootstrap-window.js - Data*/
/*${extensionKey}-start*/
/*${extensionKey}.ver.${ContextManager.version}*/
document.addEventListener('DOMContentLoaded', () => {const style=document.createElement("style");style.appendChild(document.createTextNode("body > div {background-color:transparent !important;} body {background-image:url('vscode-file://vscode-app${pathToFileURL(filePath).pathname}');background-size:cover;background-position:center;background-repeat:no-repeat;}"));document.head.appendChild(style);});
/*${extensionKey}-end*/`;

		const setupInstance = new ExtensionSetting();
		const fsReaderStub  = sinon.stub(fs, "readFileSync");
		let   fsWriterMock  = sinon.mock(fs);

		fsReaderStub.withArgs(installFilePath).returns(`/*bootstrap-window.js - Data*/
`);
		fsReaderStub.withArgs(filePath       ).returns(`${readData}`);
		fsWriterMock        = sinon.mock(fs);
		fsWriterMock.expects("writeFileSync").withArgs(path.resolve(installFilePath), writeData);

		await setupInstance.setItemValue(ExtensionSetting.propertyIds.filePath,     filePath);
		await setupInstance.setItemValue(ExtensionSetting.propertyIds.opacity,      opacity);
		await setupInstance.setItemValue(ExtensionSetting.propertyIds.advancedMode, true);
		new testTarget.MainWallpaper(installFilePath, new ExtensionSetting(), extensionKey).install();

		fsReaderStub.restore();
		fsWriterMock.restore();
		await setupInstance.uninstall();
		ctxStub.restore();
	}).timeout(30 * 1000);

	test('install - Sync', async () => {
		const ctxStub       = sinon.stub(ContextManager, "version").value("9.9.9");
		const opacity       = 0.55;
		const readData      = `test.png Data`;
		const writeData     = `/*bootstrap-window.js - Data*/
/*${extensionKey}-start*/
/*${extensionKey}.ver.${ContextManager.version}*/
document.addEventListener('DOMContentLoaded', () => {const style=document.createElement("style");style.appendChild(document.createTextNode("body > div {background-color:transparent !important;} body {background-image:url('${readData}');opacity:${opacity};background-size:cover;background-position:center;background-repeat:no-repeat;}"));document.head.appendChild(style);});
/*${extensionKey}-end*/`;

		const fsReaderStub  = sinon.stub(fs, "readFileSync");
		const fsWriterMock  = sinon.mock(fs);

		fsReaderStub.withArgs(installFilePath).returns(`/*bootstrap-window.js - Data*/
`);
		fsWriterMock.expects("writeFileSync").withArgs(path.resolve(installFilePath), writeData);

		new testTarget.MainWallpaper(installFilePath, new ExtensionSetting(), extensionKey).installFromSync(readData, opacity);

		fsReaderStub.restore();
		fsWriterMock.restore();
		ctxStub.restore();
	}).timeout(30 * 1000);

	test('installAsSlide', async () => {
		const filePaths         = [path.join(__dirname, "testDir", "test.png"), path.join(__dirname, "testDir1", "testDir2", "test.gif")];
		const opacity           = 0.55;
		const slideInterval     = 15;
		const slideIntervalUnit = "Hour";
		const fsReaderStub      = sinon.stub(fs, "readFileSync");
		let   fsWriterMock      = sinon.mock(fs);
		const ctxStub           = sinon.stub(ContextManager, "version").value("9.9.9");

		fsReaderStub.withArgs(installFilePath).returns(`/*bootstrap-window.js - Data*/
`);
		fsWriterMock.expects("writeFileSync").withArgs(path.resolve(installFilePath), `/*bootstrap-window.js - Data*/
`);

		new testTarget.MainWallpaper(installFilePath, new ExtensionSetting(), extensionKey).installAsSlide();

		fsWriterMock.restore();
		fsWriterMock            = sinon.mock(fs);

		let   writeData         = `/*bootstrap-window.js - Data*/
/*${extensionKey}-start*/
/*${extensionKey}.ver.${ContextManager.version}*/
document.addEventListener('DOMContentLoaded', () => {const style=document.createElement("style");style.appendChild(document.createTextNode("body > div {background-color:transparent !important;} body {background-image:url('vscode-file://vscode-app${pathToFileURL(filePaths[0]).pathname}'),url('vscode-file://vscode-app${pathToFileURL(filePaths[1]).pathname}');opacity:${opacity};background-size:0%;background-position:center;background-repeat:no-repeat;} body.${extensionKey}-0 {background-image:url('vscode-file://vscode-app${pathToFileURL(filePaths[0]).pathname}');background-size:cover;} body.${extensionKey}-1 {background-image:url('vscode-file://vscode-app${pathToFileURL(filePaths[1]).pathname}');background-size:cover;}"));document.head.appendChild(style);`;
		writeData               += `let images=[...Array(${filePaths.length}).keys()];`;
		writeData               += `const changeImage=(async(pre,current)=>{if(pre){document.body.classList.remove(pre);};document.body.classList.add(current);});`;
		writeData               += `let i=0;let pre=undefined;const choice=(min,max)=>{i++; return i===max?min:i;};const after=(index)=>{return;};let current="${extensionKey}-"+i.toString();changeImage(pre,current);pre=current;after(i);setInterval((async()=>{i=choice(0,Math.max(...images));current="${extensionKey}-"+i.toString();changeImage(pre,current);pre=current;after(i);}),${slideInterval * 60 * 60 * 1000});`;
		writeData               += `});
/*${extensionKey}-end*/`;

		const setupInstance = new ExtensionSetting();
		await setupInstance.setItemValue(ExtensionSetting.propertyIds.slideFilePaths,    filePaths);
		await setupInstance.setItemValue(ExtensionSetting.propertyIds.opacity,           opacity);
		await setupInstance.setItemValue(ExtensionSetting.propertyIds.slideInterval,     slideInterval);
		await setupInstance.setItemValue(ExtensionSetting.propertyIds.slideIntervalUnit, slideIntervalUnit);
		await setupInstance.setItemValue(ExtensionSetting.propertyIds.slideRandomPlay,   false);
		await setupInstance.setItemValue(ExtensionSetting.propertyIds.slideEffectFadeIn, false);
		fsWriterMock.expects("writeFileSync").withArgs(path.resolve(installFilePath), writeData);

		new testTarget.MainWallpaper(installFilePath, new ExtensionSetting(), extensionKey).installAsSlide();

		fsWriterMock.restore();
		fsWriterMock            = sinon.mock(fs);
		writeData               = `/*bootstrap-window.js - Data*/
/*${extensionKey}-start*/
/*${extensionKey}.ver.${ContextManager.version}*/
document.addEventListener('DOMContentLoaded', () => {const style=document.createElement("style");style.appendChild(document.createTextNode("body > div {background-color:transparent !important;} body {background-image:url('vscode-file://vscode-app${pathToFileURL(filePaths[0]).pathname}'),url('vscode-file://vscode-app${pathToFileURL(filePaths[1]).pathname}');opacity:${opacity};background-size:0%;background-position:center;background-repeat:no-repeat;} body.${extensionKey}-0 {background-image:url('vscode-file://vscode-app${pathToFileURL(filePaths[0]).pathname}');background-size:cover;} body.${extensionKey}-1 {background-image:url('vscode-file://vscode-app${pathToFileURL(filePaths[1]).pathname}');background-size:cover;}"));document.head.appendChild(style);`;
		writeData               += `});`
		writeData               += `window.addEventListener('load', () => {`;
		writeData               += `let images=[...Array(${filePaths.length}).keys()];`;
		writeData               += `const changeImage=(async(pre,current)=>{const sleep=(ms)=>{return new Promise((resolve,reject)=>{setTimeout(resolve,ms);});};const feedin=(async(opacity,decrement,ms)=>{let current=1;while(current>opacity){current-=decrement;document.body.style.opacity=current;await sleep(ms);};document.body.style.opacity=${opacity};});document.body.style.opacity=1;if(pre){document.body.classList.remove(pre);};document.body.classList.add(current);await feedin(${opacity},0.01,50);});`;
		writeData               += `let i=0;let pre=undefined;let played=new Array();const choice=(min,max)=>{return Math.floor(Math.random()*(max-min+1))+min;};const after=(index)=>{played.push(images[index]);images.splice(index,1);if(images.length===0){images=played;played=new Array();}};i=choice(0,images.length-1);let current="${extensionKey}-"+i.toString();changeImage(pre,current);pre=current;after(i);setInterval((async()=>{i=choice(0,Math.max(...images));current="${extensionKey}-"+i.toString();changeImage(pre,current);pre=current;after(i);}),${slideInterval * 60 * 60 * 1000});`;
		writeData               += `});
/*${extensionKey}-end*/`;
		fsWriterMock.expects("writeFileSync").withArgs(path.resolve(installFilePath), writeData);

		await setupInstance.setItemValue(ExtensionSetting.propertyIds.slideRandomPlay,       true);
		await setupInstance.setItemValue(ExtensionSetting.propertyIds.slideEffectFadeIn,     true);
		await setupInstance.setItemValue(ExtensionSetting.propertyIds.slideLoadWaitComplete, true);

		new testTarget.MainWallpaper(installFilePath, new ExtensionSetting(), extensionKey).installAsSlide();

		fsReaderStub.restore();
		fsWriterMock.restore();
		ctxStub.restore();
		await setupInstance.uninstall();
	}).timeout(30 * 1000);

	test('uninstall', async () => {
		const ctxStub       = sinon.stub(ContextManager, "version").value("9.9.9");
		const filePath      = path.join(__dirname, "testDir", "test.png");
		const opacity       = 0.55;
		const Data          = `/*bootstrap-window.js - Data*/
/*${extensionKey}-start*/
/*${extensionKey}.ver.${ContextManager.version}*/
window.onload=()=>{const style=document.createElement("style");style.appendChild(document.createTextNode("body > div {background-color:transparent !important;}body {opacity:${opacity};background-size:cover;background-position:center;background-repeat:no-repeat;}"));document.head.appendChild(style);document.body.style.backgroundImage='url("data:image/png;base64,${filePath}:base64Data")';}
/*${extensionKey}-end*/`;

		const fsReaderStub  = sinon.stub(fs, "readFileSync");
		const fsWriterMock  = sinon.mock(fs);

		fsReaderStub.withArgs(path.resolve(installFilePath)).returns(Data);
		fsWriterMock.expects("writeFileSync").withArgs(path.resolve(installFilePath), `/*bootstrap-window.js - Data*/
`);

		new testTarget.MainWallpaper(installFilePath, new ExtensionSetting(), extensionKey).uninstall();

		fsReaderStub.restore();
		fsWriterMock.restore();
		ctxStub.restore();
	}).timeout(30 * 1000);

	test('holdScriptData -> installWithPrevious', async () => {
		const setting      = new ExtensionSetting();
		const fsReaderStub = sinon.stub(fs, "readFileSync");
		const fsWriterMock = sinon.mock(fs);
		const ctxStub      = sinon.stub(ContextManager, "version").value("9.9.9");
		const filePath     = path.join(__dirname, "testDir", "test.png");
		const opacity      = 0.55;
		const previous     = `/* bootstrap-window.js - Data */
/*${extensionKey}-start*/
/*${extensionKey}.ver.${ContextManager.version}*/
/*${extensionKey}-end*/`;

		fsReaderStub.withArgs(installFilePath).returns(previous);

		const instance = new testTarget.MainWallpaper(installFilePath, setting, extensionKey);
		instance.holdScriptData();

		fsReaderStub.reset();

		fsReaderStub.withArgs(installFilePath).returns(`/* bootstrap-window.js - Data */
/*${extensionKey}-start*/
/*${extensionKey}.ver.${ContextManager.version}*/
window.onload=()=>{if(document.querySelector("body > #process-list")){return;};const style=document.createElement("style");style.appendChild(document.createTextNode("body > div {background-color:transparent !important;}body {opacity:${opacity};background-size:cover;background-position:center;background-repeat:no-repeat;}"));document.head.appendChild(style);document.body.style.backgroundImage='url("data:image/png;base64,${filePath}:base64Data")';}
/*${extensionKey}-end*/`
		);
		fsWriterMock.expects("writeFileSync").withArgs(installFilePath, previous);

		instance.installWithPrevious();

		fsWriterMock.verify();

		fsReaderStub.restore();
		fsWriterMock.restore();
		ctxStub.restore();
	}).timeout(30 * 1000);

	test('isReady and isAutoSet - Process Explorer', async () => {
		const instance = new testTargetPE.ProcessExplorer(installFilePath, new ExtensionSetting(), extensionKey);

		assert.strictEqual(instance.isReady,   undefined);
		assert.strictEqual(instance.isAutoSet, undefined);
	}).timeout(30 * 1000);

	test('install - Process Explorer', async () => {
		const ctxStub       = sinon.stub(ContextManager, "version").value("9.9.9");
		const colorCode     = `#012345`;
		const writeData     = `/*bootstrap-window.js - Data*/
/*${extensionKey}-start*/
/*${extensionKey}.ver.${ContextManager.version}*/
document.addEventListener('DOMContentLoaded', () => {const style=document.createElement("style");style.appendChild(document.createTextNode("body{background-color:${colorCode};}"));document.head.appendChild(style);});
/*${extensionKey}-end*/`;

		const fsReaderStub  = sinon.stub(fs, "readFileSync");
		let   fsWriterMock  = sinon.mock(fs);

		fsReaderStub.withArgs(installFilePath).returns(`/*bootstrap-window.js - Data*/
`);

		new testTargetPE.ProcessExplorer(installFilePath, new ExtensionSetting(), extensionKey).install();

		fsWriterMock        = sinon.mock(fs);
		fsWriterMock.expects("writeFileSync").withArgs(path.resolve(installFilePath), writeData);

		const testTarget    = new testTargetPE.ProcessExplorer(installFilePath, new ExtensionSetting(), extensionKey);

		testTarget.colorCode = colorCode;

		testTarget.install();

		fsReaderStub.restore();
		fsWriterMock.restore();
		ctxStub.restore();
	}).timeout(30 * 1000);
});
