<template>
  <Navbar />
  <div class="help-page p-8 font-sans leading-relaxed">
    <h1 class="text-3xl font-bold mb-4 text-gray-800">
      How to Get Your Notion API Key
    </h1>
    <ol class="list-decimal list-inside space-y-2">
      <li>
        Go to the
        <a
          href="https://www.notion.so/profile/integrations"
          target="_blank"
          class="text-blue-500 hover:underline"
          >Notion Integrations Page</a
        >.
      </li>
      <li>
        Click the <strong class="font-semibold">New Integration</strong> button.
      </li>
      <li>
        Fill in the required details:
        <ul class="list-disc list-inside ml-4 space-y-1">
          <li>Give your integration a name.</li>
          <li>Select the workspace you want to associate it with.</li>
        </ul>
        Then, hit <strong class="font-semibold">Save</strong>.
      </li>
      <li>Go to your main Notion page where most of your pages are linked.</li>
      <li>
        Add the integration in the
        <strong class="font-semibold">Connections</strong> tab.
      </li>
    </ol>
    <p class="mt-4 italic text-gray-600">
      Once done, you will receive your API key. Keep it secure and use it in
      your application as needed.
    </p>
  </div>
</template>

<script>
export default {
  name: "HelpPage",
};
</script>
