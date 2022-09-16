import I18n from "I18n";
import { isEmpty } from "@ember/utils";
import { userPath } from "discourse/lib/url";
import getURL from "discourse-common/lib/get-url";

const _additionalAttributes = [];

export function includeAttributes(...attributes) {
  attributes.forEach((a) => _additionalAttributes.push(a));
}

export function transformBasicPost(post) {
  // Note: it can be dangerous to not use `get` in Ember code, but this is significantly
  // faster and has tests to confirm it works. We only call `get` when the property is a CP
  const postAtts = {
    id: post.id,
    meta_tag_id: post.meta_tag_id,
    hidden: post.hidden,
    deleted: post.get("deleted"),
    deleted_at: post.deleted_at,
    user_deleted: post.user_deleted,
    isDeleted: post.deleted_at || post.user_deleted,
    deletedByAvatarTemplate: null,
    deletedByUsername: null,
    primary_group_name: post.primary_group_name,
    flair_name: post.flair_name,
    flair_url: post.flair_url,
    flair_bg_color: post.flair_bg_color,
    flair_color: post.flair_color,
    flair_group_id: post.flair_group_id,
    wiki: post.wiki,
    lastWikiEdit: post.last_wiki_edit,
    firstPost: post.post_number === 1,
    post_number: post.post_number,
    cooked: post.cooked,
    via_email: post.via_email,
    isAutoGenerated: post.is_auto_generated,
    user_id: post.user_id,
    usernameUrl: userPath(post.username),
    username: post.username,
    avatar_template: post.avatar_template,
    bookmarked: post.bookmarked,
    bookmarkReminderAt: post.bookmark_reminder_at,
    bookmarkName: post.bookmark_name,
    yours: post.yours,
    shareUrl: post.get("shareUrl"),
    staff: post.staff,
    admin: post.admin,
    moderator: post.moderator,
    groupModerator: post.group_moderator,
    new_user: post.trust_level === 0,
    name: post.name,
    user_title: post.user_title,
    title_is_group: post.title_is_group,
    created_at: post.created_at,
    updated_at: post.updated_at,
    canDelete: post.can_delete,
    canPermanentlyDelete: false,
    showFlagDelete: false,
    canRecover: post.can_recover,
    canSeeHiddenPost: post.can_see_hidden_post,
    canEdit: post.can_edit,
    canFlag: !post.get("topic.deleted") && !isEmpty(post.get("flagsAvailable")),
    canReviewTopic: false,
    reviewableId: post.reviewable_id,
    reviewableScoreCount: post.reviewable_score_count,
    reviewableScorePendingCount: post.reviewable_score_pending_count,
    version: post.version,
    canRecoverTopic: false,
    canDeleteTopic: false,
    canViewEditHistory: post.can_view_edit_history,
    canWiki: post.can_wiki,
    showLike: false,
    liked: false,
    canToggleLike: false,
    likeCount: false,
    actionsSummary: null,
    read: post.read,
    replyToUsername: null,
    replyToName: null,
    replyToAvatarTemplate: null,
    reply_to_post_number: post.reply_to_post_number,
    cooked_hidden: !!post.cooked_hidden,
    expandablePost: false,
    replyCount: post.reply_count,
    locked: post.locked,
    userCustomFields: post.user_custom_fields,
    readCount: post.readers_count,
    canPublishPage: false,
    trustLevel: post.trust_level,
    userSuspended: post.user_suspended,
  };

  _additionalAttributes.forEach((a) => (postAtts[a] = post[a]));

  return postAtts;
}

export default function transformPost(
  currentUser,
  site,
  post,
  prevPost,
  nextPost
) {
  // Note: it can be dangerous to not use `get` in Ember code, but this is significantly
  // faster and has tests to confirm it works. We only call `get` when the property is a CP
  const postType = post.post_type;
  const postTypes = site.post_types;
  const topic = post.topic;
  const details = topic.get("details");
  const filteredUpwardsPostID = topic.get("postStream.filterUpwardsPostID");
  const filteredRepliesPostNumber = topic.get(
    "postStream.filterRepliesToPostNumber"
  );

  const postAtts = transformBasicPost(post);

  const createdBy = details.created_by || {};

  postAtts.topicId = topic.id;
  postAtts.topicOwner = createdBy.id === post.user_id;
  postAtts.topicCreatedById = createdBy.id;
  postAtts.post_type = postType;
  postAtts.via_email = post.via_email;
  postAtts.isAutoGenerated = post.is_auto_generated;
  postAtts.isModeratorAction = postType === postTypes.moderator_action;
  postAtts.isWhisper = postType === postTypes.whisper;
  postAtts.isSmallAction =
    postType === postTypes.small_action || post.action_code === "split_topic";
  postAtts.canBookmark = !!currentUser;
  postAtts.canManage = currentUser && currentUser.get("canManageTopic");
  postAtts.canViewRawEmail = currentUser && currentUser.staff;
  postAtts.canArchiveTopic = !!details.can_archive_topic;
  postAtts.canCloseTopic = !!details.can_close_topic;
  postAtts.canSplitMergeTopic = !!details.can_split_merge_topic;
  postAtts.canEditStaffNotes = !!details.can_edit_staff_notes;
  postAtts.canReplyAsNewTopic = !!details.can_reply_as_new_topic;
  postAtts.canReviewTopic = !!details.can_review_topic;
  postAtts.canPublishPage =
    !!details.can_publish_page && post.post_number === 1;
  postAtts.isWarning = topic.is_warning;
  postAtts.links = post.get("internalLinks");
  postAtts.replyDirectlyBelow =
    nextPost &&
    nextPost.reply_to_post_number === post.post_number &&
    post.post_number !== filteredRepliesPostNumber;
  postAtts.replyDirectlyAbove =
    prevPost &&
    post.id !== filteredUpwardsPostID &&
    post.reply_to_post_number === prevPost.post_number;
  postAtts.linkCounts = post.link_counts;
  postAtts.actionCode = post.action_code;
  postAtts.actionCodeWho = post.action_code_who;
  postAtts.actionCodePath = getURL(post.action_code_path || `/t/${topic.id}`);
  postAtts.topicUrl = topic.get("url");
  postAtts.isSaving = post.isSaving;
  postAtts.staged = post.staged;
  postAtts.user = post.user;

  if (post.notice) {
    postAtts.notice = post.notice;
    if (postAtts.notice.type === "returning_user") {
      postAtts.notice.lastPostedAt = new Date(post.notice.last_posted_at);
    }
  }

  if (post.post_number === 1 && topic.requested_group_name) {
    postAtts.requestedGroupName = topic.requested_group_name;
  }

  const showPMMap =
    topic.archetype === "private_message" && post.post_number === 1;
  if (showPMMap) {
    postAtts.showPMMap = true;
    postAtts.allowedGroups = details.allowed_groups;
    postAtts.allowedUsers = details.allowed_users;
    postAtts.canRemoveAllowedUsers = details.can_remove_allowed_users;
    postAtts.canRemoveSelfId = details.can_remove_self_id;
    postAtts.canInvite = details.can_invite_to;
  }

  const showTopicMap =
    (_additionalAttributes.includes("topicMap") && post.post_number === 1) ||
    showPMMap ||
    (post.post_number === 1 &&
      topic.archetype === "regular" &&
      topic.posts_count > 1);
  if (showTopicMap) {
    postAtts.showTopicMap = true;
    postAtts.topicCreatedAt = topic.created_at;
    postAtts.createdByUsername = createdBy.username;
    postAtts.createdByAvatarTemplate = createdBy.avatar_template;
    postAtts.createdByName = createdBy.name;

    postAtts.lastPostUrl = topic.get("lastPostUrl");
    if (details.last_poster) {
      postAtts.lastPostUsername = details.last_poster.username;
      postAtts.lastPostAvatarTemplate = details.last_poster.avatar_template;
      postAtts.lastPostName = details.last_poster.name;
    }
    postAtts.lastPostAt = topic.last_posted_at;

    postAtts.topicReplyCount = topic.get("replyCount");
    postAtts.topicViews = topic.views;
    postAtts.topicViewsHeat = topic.get("viewsHeat");

    postAtts.participantCount = topic.participant_count;
    postAtts.topicLikeCount = topic.like_count;
    postAtts.topicLinks = details.links;
    if (postAtts.topicLinks) {
      postAtts.topicLinkLength = details.links.length;
    }
    postAtts.topicPostsCount = topic.posts_count;

    postAtts.participants = details.participants;

    const postStream = topic.get("postStream");
    postAtts.userFilters = postStream.userFilters;
    postAtts.topicSummaryEnabled = postStream.summary;
    postAtts.topicWordCount = topic.word_count;
    postAtts.hasTopRepliesSummary = topic.has_summary;
    postAtts.summarizable = topic.summarizable;
  }

  if (postAtts.isDeleted) {
    postAtts.deletedByAvatarTemplate = post.get(
      "postDeletedBy.avatar_template"
    );
    postAtts.deletedByUsername = post.get("postDeletedBy.username");
  }

  const replyToUser = post.get("reply_to_user");
  if (replyToUser) {
    postAtts.replyToUsername = replyToUser.username;
    postAtts.replyToName = replyToUser.name;
    postAtts.replyToAvatarTemplate = replyToUser.avatar_template;
  }

  if (post.actions_summary) {
    postAtts.actionsSummary = post.actions_summary
      .filter((a) => {
        return a.actionType.name_key !== "like" && a.acted;
      })
      .map((a) => {
        const action = a.actionType.name_key;

        return {
          id: a.id,
          postId: post.id,
          action,
          canUndo: a.can_undo,
          description: I18n.t(`post.actions.by_you.${action}`),
        };
      });
  }

  const likeAction = post.likeAction;
  if (likeAction) {
    postAtts.liked = likeAction.acted;
    postAtts.canToggleLike = likeAction.get("canToggle");
    postAtts.showLike = postAtts.liked || postAtts.canToggleLike;
    postAtts.likeCount = likeAction.count;
  } else if (
    !currentUser ||
    (topic.archived && topic.user_id !== currentUser.id)
  ) {
    postAtts.showLike = true;
  }

  if (postAtts.post_number === 1) {
    postAtts.canRecoverTopic = postAtts.isDeleted && details.can_recover;
    postAtts.canDeleteTopic = !postAtts.isDeleted && details.can_delete;
    postAtts.expandablePost = topic.expandable_first_post;
    postAtts.canPermanentlyDelete =
      postAtts.isDeleted && details.can_permanently_delete;

    // Show a "Flag to delete" message if not staff and you can't
    // otherwise delete it.
    postAtts.showFlagDelete =
      !postAtts.canDelete &&
      postAtts.yours &&
      postAtts.canFlag &&
      currentUser &&
      !currentUser.staff;
  } else {
    postAtts.canRecover = postAtts.isDeleted && postAtts.canRecover;
    postAtts.canDelete =
      postAtts.canDelete &&
      !post.deleted_at &&
      currentUser &&
      (currentUser.staff || !post.user_deleted);
    postAtts.canPermanentlyDelete =
      postAtts.isDeleted && post.can_permanently_delete;
  }

  _additionalAttributes.forEach((a) => (postAtts[a] = post[a]));

  return postAtts;
}
