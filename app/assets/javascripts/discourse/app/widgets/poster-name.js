import { applyDecorators, createWidget } from "discourse/widgets/widget";
import I18n from "I18n";
import { formatUsername } from "discourse/lib/utilities";
import getURL from "discourse-common/lib/get-url";
import { h } from "virtual-dom";
import { iconNode } from "discourse-common/lib/icon-library";
import { prioritizeNameInUx } from "discourse/lib/settings";
import RawHtml from "discourse/widgets/raw-html";

let sanitizeName = function (name) {
  return name.toLowerCase().replace(/[\s\._-]/g, "");
};

export function disableNameSuppression() {
  sanitizeName = (name) => name;
}

createWidget("poster-name-title", {
  tagName: "span.user-title",

  html(attrs) {
    let titleContents = attrs.title;
    if (attrs.primaryGroupName && attrs.titleIsGroup) {
      const href = getURL(`/g/${attrs.primaryGroupName}`);
      titleContents = h(
        "a.user-group",
        {
          className: attrs.extraClasses,
          attributes: { href, "data-group-card": attrs.primaryGroupName },
        },
        attrs.title
      );
    }
    return titleContents;
  },
});

export default createWidget("poster-name", {
  tagName: "div.names.trigger-user-card",

  settings: {
    showNameAndGroup: true,
    showGlyph: true,
  },

  didRenderWidget() {
    if (this.attrs.user) {
      this.attrs.user.trackStatus();
      this.attrs.user.on("status-changed", this, "scheduleRerender");
    }
  },

  willRerenderWidget() {
    if (this.attrs.user) {
      this.attrs.user.off("status-changed", this, "scheduleRerender");
      this.attrs.user.stopTrackingStatus();
    }
  },

  // TODO: Allow extensibility
  posterGlyph(attrs) {
    if (attrs.moderator || attrs.groupModerator) {
      return iconNode("shield-alt", {
        title: I18n.t("user.moderator_tooltip"),
      });
    }
  },

  userLink(attrs, text) {
    return h(
      "a",
      {
        attributes: {
          href: attrs.usernameUrl,
          "data-user-card": attrs.username,
          class: `${
            this.siteSettings.hide_user_profiles_from_public &&
            !this.currentUser
              ? "non-clickable"
              : ""
          }`,
        },
      },
      formatUsername(text)
    );
  },

  html(attrs) {
    const username = attrs.username;
    const name = attrs.name;
    const nameFirst =
      this.siteSettings.display_name_on_posts && prioritizeNameInUx(name);
    const classNames = nameFirst
      ? ["first", "full-name"]
      : ["first", "username"];
    console.log("username", username)
    console.log("name", name)
    console.log("nameFirst", nameFirst)
    if (attrs.staff) {
      classNames.push("staff");
    }
    if (attrs.admin) {
      classNames.push("admin");
    }
    if (attrs.moderator) {
      classNames.push("moderator");
    }
    if (attrs.groupModerator) {
      classNames.push("category-moderator");
    }
    if (attrs.new_user) {
      classNames.push("new-user");
    }
    console.log("classNames", classNames)

    const primaryGroupName = attrs.primary_group_name;
    if (primaryGroupName && primaryGroupName.length) {
      classNames.push(primaryGroupName);
    }
    let nameContents = [this.userLink(attrs, nameFirst ? name : username)];

    if (this.settings.showGlyph) {
      const glyph = this.posterGlyph(attrs);
      if (glyph) {
        nameContents.push(glyph);
      }
    }

    const afterNameContents = this.afterNameContents(attrs);
    const credits = this.creditsIndicator(attrs);
    nameContents = nameContents.concat(afterNameContents);
    nameContents = nameContents.concat(credits);

    const contents = [
      h("span", { className: classNames.join(" ") }, nameContents),
    ];

    if (!this.settings.showNameAndGroup) {
      return contents;
    }

    if (
      name &&
      this.siteSettings.display_name_on_posts &&
      sanitizeName(name) !== sanitizeName(username)
    ) {
      contents.push(
        h(
          "span.second." + (nameFirst ? "username" : "full-name"),
          [this.userLink(attrs, nameFirst ? username : name)].concat(
            afterNameContents
          )
        )
      );
    }

    const title = attrs.user_title,
      titleIsGroup = attrs.title_is_group;
    if (title && title.length) {
      contents.push(
        this.attach("poster-name-title", {
          title,
          primaryGroupName,
          titleIsGroup,
        })
      );
    }

    return contents;
  },

  afterNameContents(attrs) {
    const contents = [];
    if (
      this.siteSettings.enable_user_status &&
      attrs.user &&
      attrs.user.status
    ) {
      contents.push(this.attach("post-user-status", attrs.user.status));
    }
    contents.push(...applyDecorators(this, "after-name", attrs, this.state));
    return contents;
  },

  creditsIndicator(attrs) {
    const contents = [];
    if (attrs.userCustomFields && attrs.userCustomFields.credit_balance) {
      const credits = attrs.userCustomFields.credit_balance
      let html = new RawHtml({
        html: `<span style="margin-left: 5px;">${credits} <-- credit balance</span>`
      })
      contents.push(html)
    }
    return contents;
  },
});
