import {defineRelations} from 'drizzle-orm'
import * as schema from './schema'

// Relasi ORM terpusat (RQB v2). Sisi `one` = pemegang FK dan menyebut from/to;
// sisi `many` tertaut otomatis dari pasangannya.
export const relations = defineRelations(schema, (r) => ({
    user: {
        sessions: r.many.session(),
        accounts: r.many.account(),
        socialAccounts: r.many.socialAccounts(),
        audits: r.many.audits(),
        posts: r.many.posts(),
        patterns: r.many.patterns(),
        agents: r.many.agents(),
        chatConversations: r.many.chatConversations(),
    },

    session: {
        user: r.one.user({from: r.session.userId, to: r.user.id}),
    },

    account: {
        user: r.one.user({from: r.account.userId, to: r.user.id}),
    },

    socialAccounts: {
        user: r.one.user({from: r.socialAccounts.userId, to: r.user.id}),
        audits: r.many.audits(),
        posts: r.many.posts(),
        credentials: r.many.accountCredentials(),
        demographics: r.many.accountDemographics(),
    },

    accountCredentials: {
        user: r.one.user({from: r.accountCredentials.userId, to: r.user.id}),
        account: r.one.socialAccounts({
            from: r.accountCredentials.accountId,
            to: r.socialAccounts.id,
        }),
    },

    accountDemographics: {
        user: r.one.user({from: r.accountDemographics.userId, to: r.user.id}),
        account: r.one.socialAccounts({
            from: r.accountDemographics.accountId,
            to: r.socialAccounts.id,
        }),
    },

    audits: {
        user: r.one.user({from: r.audits.userId, to: r.user.id}),
        account: r.one.socialAccounts({from: r.audits.accountId, to: r.socialAccounts.id}),
        posts: r.many.posts(),
        patterns: r.many.patterns(),
    },

    posts: {
        audit: r.one.audits({from: r.posts.auditId, to: r.audits.id}),
        user: r.one.user({from: r.posts.userId, to: r.user.id}),
        account: r.one.socialAccounts({from: r.posts.accountId, to: r.socialAccounts.id}),
        ingredients: r.many.ingredients(),
        comments: r.many.comments(),
        engagementSnapshots: r.many.engagementSnapshots(),
    },

    ingredients: {
        post: r.one.posts({from: r.ingredients.postId, to: r.posts.id}),
        user: r.one.user({from: r.ingredients.userId, to: r.user.id}),
    },

    comments: {
        post: r.one.posts({from: r.comments.postId, to: r.posts.id}),
        user: r.one.user({from: r.comments.userId, to: r.user.id}),
    },

    engagementSnapshots: {
        post: r.one.posts({from: r.engagementSnapshots.postId, to: r.posts.id}),
        user: r.one.user({from: r.engagementSnapshots.userId, to: r.user.id}),
    },

    patterns: {
        user: r.one.user({from: r.patterns.userId, to: r.user.id}),
        audit: r.one.audits({from: r.patterns.auditId, to: r.audits.id}),
    },

    chatConversations: {
        user: r.one.user({from: r.chatConversations.userId, to: r.user.id}),
        messages: r.many.chatMessages(),
    },

    chatMessages: {
        conversation: r.one.chatConversations({
            from: r.chatMessages.conversationId,
            to: r.chatConversations.id,
        }),
        user: r.one.user({from: r.chatMessages.userId, to: r.user.id}),
    },

    agents: {
        user: r.one.user({from: r.agents.userId, to: r.user.id}),
        knowledgebases: r.many.knowledgebases(),
        knowledgeChunks: r.many.knowledgeChunks(),
        webhooks: r.many.agentWebhooks(),
    },

    agentWebhooks: {
        agent: r.one.agents({from: r.agentWebhooks.agentId, to: r.agents.id}),
    },

    knowledgebases: {
        agent: r.one.agents({from: r.knowledgebases.agentId, to: r.agents.id}),
        chunks: r.many.knowledgeChunks(),
    },

    knowledgeChunks: {
        knowledgebase: r.one.knowledgebases({
            from: r.knowledgeChunks.knowledgebaseId,
            to: r.knowledgebases.id,
        }),
        agent: r.one.agents({from: r.knowledgeChunks.agentId, to: r.agents.id}),
    },
}))
