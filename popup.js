
// popup.js

const FAVICON_API = "http://favicon.hatena.ne.jp/?url=";
var BG = chrome.extension.getBackgroundPage();
var removeMode = false;

////////////////////////////////////////////////

function RemoveItemFromMenu(index)
{
	$("#items li:eq(" + index + ")").remove();
}

function SetItemToMenu(title, url)
{
	var newAnchor = document.createElement("a");
	var newList = document.createElement("li");
	var newDiv = document.createElement("div");
	var newFavicon = document.createElement("img");
	var removeIcon = document.createElement("img");
	var mainMenu = document.getElementById("items");
	
	newFavicon.setAttribute("src", FAVICON_API + url);
	newFavicon.setAttribute("class", "favicon");
	newAnchor.appendChild(newFavicon);
	newAnchor.appendChild(document.createTextNode(title));
	newAnchor.setAttribute("class", "ui-corner-all");
	newAnchor.setAttribute("role", "menuitem");
	newList.appendChild(newAnchor);
	newList.setAttribute("class", "ui-menu-item");
	newList.setAttribute("role", "presentation");
	mainMenu.appendChild(newList);	
}

function RestoreSavedItems()
{
	var Items = [];

	if (localStorage["Items"]) {
		Items = JSON.parse(localStorage["Items"]);
		console.group("<< Previously stocked items >>");
		Items.forEach(function(Item, i) {
			if(Item) {
				console.log(i + " " + Item["title"] + " :: " + Item["url"]);
				SetItemToMenu(Item["title"], Item["url"]);
			}
		});
		console.groupEnd();
		chrome.browserAction.setBadgeText({text: String(Items.length)});
	}
}

function AddItem(item)
{
	SetItemToMenu(item.title, item.url);
	BG.AddDataAndUpdateStorage(item.title, item.url);
	console.group("<< New item added >>");
	console.log("Title: " + item.title);
	console.log("URL: " + item.url);
	console.groupEnd();
}

function RemoveItem(item)
{
	RemoveItemFromMenu(item["index"]);
	BG.RemoveDataAndUpdateStorage(item["title"]);
}

function LaunchItem(title)
{
	var Items = JSON.parse(localStorage["Items"]);
	for (var i in Items) {
		if (Items[i]["title"] == title) {
			chrome.tabs.create({url: Items[i]["url"], selected: false});
			return;
		}
	}
}

////////////////////////////////////////////////

document.body.onload = function() {
	RestoreSavedItems();
	removeModeOn = false;
	
	$("#add").button();
	$("#options").button();
	$("#remove").button();
	$("#items").menu({
		select: function(event, ui) {
			if (removeMode) {
				RemoveItem({"index": ui.item.index(), "title": ui.item.text()});
			} else {
				LaunchItem(ui.item.text());
			}
		}
	});	
};

$("#add").on("click", function() {
	chrome.tabs.getSelected(window.id, function (tab) {
		if (!BG.isDuplicated(tab.url)) {
			AddItem(tab);
		} else {
			BG.errorNotification();
		}
	});
});

$("#remove").on("click", function() {
	var removeButton = document.getElementById("remove");
	if (removeButton.checked) {
		$(".ui-button-text").css("color", "red");
		$(".ui-menu").css("cursor", "pointer");
		$("#add").button("disable");
	} else {
		$(".ui-button-text").css("color", "black");
		$(".ui-menu").css("cursor", "default");
		$("#add").button("enable");
	}
	removeMode = ! removeMode;
});

$("#options").on("click", function() {
	console.log("Options");
});
