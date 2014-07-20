
// background.js

const ui_menu_defaultPopupWidth = 250;
const ui_menu_maxPopupWidth = 500;
const ui_defaultFontSize = 0.7;

const NOTIFY_ID = "default";
const ITEMS_ID = "Items";
const OPTION_POPUP_WIDTH = "PopupWidth";
const OPTION_FONT_SIZE = "FontSize";
const OPTION_HIDE_FAVICONS = "HideFavicon";
const OPTION_AUTO_SORT = "AutomaticSort";

function undefinedResolver()
{
	if (localStorage.getItem(OPTION_POPUP_WIDTH) == undefined) {
		localStorage.setItem(OPTION_POPUP_WIDTH, ui_menu_defaultPopupWidth);
	}
	if (localStorage.getItem(OPTION_FONT_SIZE) == undefined) {
		localStorage.setItem(OPTION_FONT_SIZE, ui_defaultFontSize);
	}
	if (localStorage.getItem(ITEMS_ID) == undefined) {
		localStorage.setItem(ITEMS_ID, new Array());
	}
}

function isDuplicated(url)
{
	var r = false;
	if (localStorage.getItem(ITEMS_ID).length > 0) {
		JSON.parse(localStorage.getItem(ITEMS_ID)).forEach(function(Item, i) {
		if (Item["url"] == url) {
				r = true;
			}
		});
	}
	return r;
}

function AddDataAndUpdateStorage(title, url)
{
	var Items = [];

	if (localStorage.getItem(ITEMS_ID).length > 0) {
		Items = JSON.parse(localStorage.getItem(ITEMS_ID));
	}
	Items.push({ "title": title, "url": url });

	if (localStorage.getItem(OPTION_AUTO_SORT) == "true") {
		Items.sort(function(a, b) {
			if (a.title > b.title) return 1;
			if (a.title < b.title) return -1;
			return 0;
		});
	}

	localStorage.setItem(ITEMS_ID, JSON.stringify(Items));
	chrome.browserAction.setBadgeText({text: String(Items.length)});

	console.group("<< New item added >>");
	console.log("Title: " + title);
	console.log("URL: " + url);
	console.groupEnd();
}

function RemoveDataAndUpdateStorage(title)
{
	var Items = JSON.parse(localStorage.getItem(ITEMS_ID));
	for (var i in Items) {
		if (Items[i]["title"] == title) {
			Items.splice(i, 1);
		}
	}
	localStorage.setItem(ITEMS_ID, JSON.stringify(Items));
	chrome.browserAction.setBadgeText({text: String(Items.length)});
}

function errorNotification()
{
	chrome.notifications.create(NOTIFY_ID, {
			type: "basic",
			title: "TabStocker: Error",
			message: "The same titled tab is now already stocked",
			iconUrl: "error.png"
		}, function(id) {
			console.log("TabStocker: Duplication Error");
	});
}

chrome.commands.onCommand.addListener(function(command) {
	if (command == "stock-tab") {	
		chrome.tabs.getSelected(window.id, function(tab) {
			if (!isDuplicated(tab.url)) {
				chrome.notifications.create(NOTIFY_ID, {
						type: "basic",
						title: "TabStocker: Success",
						message: tab.title,
						iconUrl: "main.png"
					}, function(id) {
						AddDataAndUpdateStorage(tab.title, tab.url);
						console.log("TabStocker: ShortcutKey Success");
				});
			} else {
				errorNotification();
			}
		});
	}
});

chrome.contextMenus.create({
	"title": "Stock this link",
	"contexts": ["link"],
	"onclick": function(info, tab) {
		console.log(info.linkUrl);
	}
});
