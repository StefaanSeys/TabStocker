
// popup.js

// API url for obtaining favicons
const FAVICON_API = "http://favicon.hatena.ne.jp/?url=";

// Tabs
const ITEMS_SYNC_TAB = 0;
const ITEMS_LOCAL_TAB = 1;

var BG = chrome.extension.getBackgroundPage();
var removeMode = false;

////////////////////////////////////////////////

function RemoveItemFromMenu(index, tab)
{
	$("#" + tab + " li:eq(" + index + ")").hide('slide', {direction: 'right'}, 200);
}

function SetItemToMenu(title, url, tab)
{
	var newAnchor = document.createElement("a");
	var newList = document.createElement("li");
	var newDiv = document.createElement("div");
	var mainMenu = document.getElementById(tab);
	var newFavicon;

	// For favicon hide option
	if (localStorage.getItem(BG.OPTION_HIDE_FAVICONS) != "true") {
		newFavicon = document.createElement("img");
		newFavicon.setAttribute("src", FAVICON_API + url);
		newFavicon.setAttribute("class", "favicon");
		newAnchor.appendChild(newFavicon);
	}

	newAnchor.appendChild(document.createTextNode(title));
	newAnchor.setAttribute("class", "ui-corner-all");
	newAnchor.setAttribute("role", "menuitem");
	newAnchor.setAttribute("style", "width: " + $("body").width() - 12 + "px");
	newList.appendChild(newAnchor);
	newList.setAttribute("class", "ui-menu-item");
	newList.setAttribute("role", "presentation");
	newList.setAttribute("style", "width: " + $("body").width() - 12 + "px");
	mainMenu.appendChild(newList);
}

function RestoreSavedItems()
{
	var Items = [];

  // Local items
	if (localStorage.getItem(BG.ITEMS_ID).length > 0) {
		Items = JSON.parse(localStorage.getItem(BG.ITEMS_ID));
		console.group("<< Previously stocked items (Local) >>");
		Items.forEach(function(Item, i) {
			if (Item) {
				console.log(i + " " + Item["title"] + " :: " + Item["url"]);
				SetItemToMenu(Item["title"], Item["url"], "items-local");
			}
		});
		console.groupEnd();
		chrome.browserAction.setBadgeText({text: String(Items.length)});
	}

	// Sync Items
	Items = [];
  chrome.storage.sync.get("items", function(data) {
    if (!chrome.runtime.error) {
      var d = data.items;
      if (d !== undefined && data.items.length > 0) {
        Items = data.items;
      }
      console.group("<< Previously stocked items (Sync) >>");
      Items.forEach(function(Item, i) {
        if (Item) {
          console.log(i + " " + Item["title"] + " :: " + Item["url"]);
          SetItemToMenu(Item["title"], Item["url"], "items-sync");
        }
      });
      console.groupEnd();
    }
  });
}

function AddItem(item)
{
	SetItemToMenu(item.title, item.url, BG.currentTab);
	BG.AddDataAndUpdateStorage(item.title, item.url, BG.currentTab);
}

function RemoveItem(item)
{
	RemoveItemFromMenu(item["index"], BG.currentTab);
	BG.RemoveDataAndUpdateStorage(item["title"], BG.currentTab);
}

function LaunchItem(title)
{
  var Items;

  if (BG.currentTab === "items-local") {
  	Items = JSON.parse(localStorage.getItem(BG.ITEMS_ID));
  	launch(Items, title);

  } else { // === "items-sync"
    chrome.storage.sync.get("items", function(data) {
      if (!chrome.runtime.error) {
        var d = data.items;
        if (d !== undefined && data.items.length > 0) {
          Items = data.items;
        }
        launch(Items, title);
      }
    });
  }
}

function launch(array, title)
{
  for (var i in array) {
  	if (array[i]["title"] == title) {
  	  chrome.tabs.create({url: array[i]["url"], selected: false});
  		break;
  	}
  }
}

function SaveReorderedList()
{
	var Items;

	if (BG.currentTab == "items-local") {
	  Items = JSON.parse(localStorage.getItem(BG.ITEMS_ID));
	  localStorage.setItem(BG.ITEMS_ID, undefined);
	  localStorage.setItem(BG.ITEMS_ID, JSON.stringify(reorder(Items)));
	} else { // == "items-sync"
	  chrome.storage.sync.get("items", function(data) {
	    if (!chrome.runtime.error) {
	      var d = data.items;
	    }
	    if (d !== undefined && data.items.length > 0) {
        Items = data.items;
      }
      chrome.storage.sync.set({ "items": reorder(Items) }, function(){
        console.log("Reordered: items-sync");
      });
	  });
	}
}

function reorder(array)
{
	var storageLength = array.length;
  var targetList;
	var temps = [];
	var url;

  if (BG.currentTab == "items-local") {
    targetList = $("#local li");
  } else { // == "items-sync"
    targetList = $("#sync li");
  }

	for (i = 0;i < targetList.length ;i++) {
		title = targetList[i].textContent;
		url = undefined;
		for (var j in array) {
			if (array[j]["title"] == title) {
				url = array[j]["url"];
				temps.push({"title": title, "url": url});
				break;
			}
		}
	}

	return temps;
}

////////////////////////////////////////////////

document.body.onload = function() {
	BG.undefinedResolver()
	$("body").css("font-size", localStorage.getItem(BG.OPTION_FONT_SIZE) + "em");
	$("body").width(localStorage.getItem(BG.OPTION_POPUP_WIDTH));
	$("ul").width($("body").width() - 4);
	$("a.ui-menu-item").width($("body").width() - 12);

	$("#add").button();
	$("#options").button();
	$("#remove").button();

	$(".items").menu({
		select: function(event, ui) {
			if (removeMode) {
				RemoveItem({"index": ui.item.index(), "title": ui.item.text()});
			} else {
				LaunchItem(ui.item.text());
			}
		}
	});
	$(".items").sortable({ placeholder: "ui-state-highlight" });
	$(".items").disableSelection();
	$(".items").sortable({ update: SaveReorderedList });

	// Height value loading should be placed just after saved items restoring
	$(".ui-menu").height(localStorage.getItem(BG.OPTION_POPUP_HEIGHT));

	// Settings for tab
	var active_tab = ITEMS_SYNC_TAB;
	if (BG.currentTab == "items-sync") {
	  active_tab = ITEMS_LOCAL_TAB;
	}
	$("#tabs").tabs({
	  activate: function(event, ui) {
      if (ui.newPanel.selector === "#local") {
        BG.currentTab = "items-local";
      } else { // === "#sync"
        BG.currentTab = "items-sync";
      }
      console.log("Tab switched: " + BG.currentTab);
	  },
	  active: active_tab
	});
	$(".ui-tabs-nav").width($("body").width() - 13);
	$("#items-sync").width($("body").width() - 11).css("margin-top", "3px");
	$("#items-local").width($("body").width() - 11).css("margin-top", "3px");

	// It should be called after popup width settings were applied on loading
	// itemSorting() should always be called here before RestoreSavedItems()
	BG.itemSorting();
	RestoreSavedItems();

	// Resets a flag for remove mode
	removeModeOn = false;
};

$("#add").on("click", function() {
	chrome.tabs.getSelected(window.id, function (tab) {
	  if (BG.currentTab === "items-local") {
	    if (!BG.isDuplicated(tab.url)) {
	      AddItem(tab);
	    } else {
	      BG.errorNotification();
	    }
	  } else { // === "items-sync"
  	  chrome.storage.sync.get("items", function(data) {
  	    if (!chrome.runtime.lastError) {
  	      var d = data.items, r = false;
  	      if (d !== undefined && d.length > 0) {
  	        d.forEach(function(item, i) {
              if (item["url"] === tab.url) {
                r = true;
              }
  	        });
  	        if (r === true) {
  	          BG.errorNotification();
  	          return;
  	        }
  	      }
  	      AddItem(tab);
  	    }
  	  });
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
	chrome.tabs.create({url: "options.html", selected: true});
});
