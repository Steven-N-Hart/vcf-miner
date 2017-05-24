


<!DOCTYPE html>
<html lang="en" class="">
  <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# object: http://ogp.me/ns/object# article: http://ogp.me/ns/article# profile: http://ogp.me/ns/profile#">
    <meta charset='utf-8'>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta http-equiv="Content-Language" content="en">
    
    
    <title>bootstrap-wysiwyg/README.md at master · mindmup/bootstrap-wysiwyg · GitHub</title>
    <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" title="GitHub">
    <link rel="fluid-icon" href="https://github.com/fluidicon.png" title="GitHub">
    <link rel="apple-touch-icon" sizes="57x57" href="/apple-touch-icon-114.png">
    <link rel="apple-touch-icon" sizes="114x114" href="/apple-touch-icon-114.png">
    <link rel="apple-touch-icon" sizes="72x72" href="/apple-touch-icon-144.png">
    <link rel="apple-touch-icon" sizes="144x144" href="/apple-touch-icon-144.png">
    <meta property="fb:app_id" content="1401488693436528">

      <meta content="@github" name="twitter:site" /><meta content="summary" name="twitter:card" /><meta content="mindmup/bootstrap-wysiwyg" name="twitter:title" /><meta content="bootstrap-wysiwyg - Tiny bootstrap-compatible WISWYG rich text editor" name="twitter:description" /><meta content="https://avatars2.githubusercontent.com/u/3287699?v=3&amp;s=400" name="twitter:image:src" />
      <meta content="GitHub" property="og:site_name" /><meta content="object" property="og:type" /><meta content="https://avatars2.githubusercontent.com/u/3287699?v=3&amp;s=400" property="og:image" /><meta content="mindmup/bootstrap-wysiwyg" property="og:title" /><meta content="https://github.com/mindmup/bootstrap-wysiwyg" property="og:url" /><meta content="bootstrap-wysiwyg - Tiny bootstrap-compatible WISWYG rich text editor" property="og:description" />
      <meta name="browser-stats-url" content="/_stats">
    <link rel="assets" href="https://assets-cdn.github.com/">
    <link rel="conduit-xhr" href="https://ghconduit.com:25035">
    
    <meta name="pjax-timeout" content="1000">
    

    <meta name="msapplication-TileImage" content="/windows-tile.png">
    <meta name="msapplication-TileColor" content="#ffffff">
    <meta name="selected-link" value="repo_source" data-pjax-transient>
      <meta name="google-analytics" content="UA-3769691-2">

    <meta content="collector.githubapp.com" name="octolytics-host" /><meta content="collector-cdn.github.com" name="octolytics-script-host" /><meta content="github" name="octolytics-app-id" /><meta content="81B0C5DC:12A4:A1A889:54E22DCF" name="octolytics-dimension-request_id" />
    
    <meta content="Rails, view, blob#show" name="analytics-event" />

    
    
    <link rel="icon" type="image/x-icon" href="https://assets-cdn.github.com/favicon.ico">


    <meta content="authenticity_token" name="csrf-param" />
<meta content="Eaw+S1UYdQ9lviXxjuMwCTivntjR4mv7AuBvjoO8E0dKD7U+HoNtVJy9OmlshXMRXhQ+O9473rlIyo16V5+qKQ==" name="csrf-token" />

    <link href="https://assets-cdn.github.com/assets/github-fa88606a5947f4a48d110b075938a6aea6c2a3f9a48257a8d71e101c058af273.css" media="all" rel="stylesheet" />
    <link href="https://assets-cdn.github.com/assets/github2-001b8ff6b9af1d78d785feee91eaacf441aa9c531b0b1ad513b01221d194cb1d.css" media="all" rel="stylesheet" />
    
    


    <meta http-equiv="x-pjax-version" content="cfd652091681bbb1358ca7dc522fbbb9">

      
  <meta name="description" content="bootstrap-wysiwyg - Tiny bootstrap-compatible WISWYG rich text editor">
  <meta name="go-import" content="github.com/mindmup/bootstrap-wysiwyg git https://github.com/mindmup/bootstrap-wysiwyg.git">

  <meta content="3287699" name="octolytics-dimension-user_id" /><meta content="mindmup" name="octolytics-dimension-user_login" /><meta content="9226653" name="octolytics-dimension-repository_id" /><meta content="mindmup/bootstrap-wysiwyg" name="octolytics-dimension-repository_nwo" /><meta content="true" name="octolytics-dimension-repository_public" /><meta content="true" name="octolytics-dimension-repository_is_fork" /><meta content="19204005" name="octolytics-dimension-repository_parent_id" /><meta content="steveathon/bootstrap-wysiwyg" name="octolytics-dimension-repository_parent_nwo" /><meta content="19204005" name="octolytics-dimension-repository_network_root_id" /><meta content="steveathon/bootstrap-wysiwyg" name="octolytics-dimension-repository_network_root_nwo" />
  <link href="https://github.com/mindmup/bootstrap-wysiwyg/commits/master.atom" rel="alternate" title="Recent Commits to bootstrap-wysiwyg:master" type="application/atom+xml">

  </head>


  <body class="logged_out  env-production macintosh vis-public fork page-blob">
    <a href="#start-of-content" tabindex="1" class="accessibility-aid js-skip-to-content">Skip to content</a>
    <div class="wrapper">
      
      
      
      


      
      <div class="header header-logged-out" role="banner">
  <div class="container clearfix">

    <a class="header-logo-wordmark" href="https://github.com/" data-ga-click="(Logged out) Header, go to homepage, icon:logo-wordmark">
      <span class="mega-octicon octicon-logo-github"></span>
    </a>

    <div class="header-actions" role="navigation">
        <a class="button primary" href="/join" data-ga-click="(Logged out) Header, clicked Sign up, text:sign-up">Sign up</a>
      <a class="button" href="/login?return_to=%2Fmindmup%2Fbootstrap-wysiwyg%2Fblob%2Fmaster%2FREADME.md" data-ga-click="(Logged out) Header, clicked Sign in, text:sign-in">Sign in</a>
    </div>

    <div class="site-search repo-scope js-site-search" role="search">
      <form accept-charset="UTF-8" action="/mindmup/bootstrap-wysiwyg/search" class="js-site-search-form" data-global-search-url="/search" data-repo-search-url="/mindmup/bootstrap-wysiwyg/search" method="get"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /></div>
  <input type="text"
    class="js-site-search-field is-clearable"
    data-hotkey="s"
    name="q"
    placeholder="Search"
    data-global-scope-placeholder="Search GitHub"
    data-repo-scope-placeholder="Search"
    tabindex="1"
    autocapitalize="off">
  <div class="scope-badge">This repository</div>
</form>
    </div>

      <ul class="header-nav left" role="navigation">
          <li class="header-nav-item">
            <a class="header-nav-link" href="/explore" data-ga-click="(Logged out) Header, go to explore, text:explore">Explore</a>
          </li>
          <li class="header-nav-item">
            <a class="header-nav-link" href="/features" data-ga-click="(Logged out) Header, go to features, text:features">Features</a>
          </li>
          <li class="header-nav-item">
            <a class="header-nav-link" href="https://enterprise.github.com/" data-ga-click="(Logged out) Header, go to enterprise, text:enterprise">Enterprise</a>
          </li>
          <li class="header-nav-item">
            <a class="header-nav-link" href="/blog" data-ga-click="(Logged out) Header, go to blog, text:blog">Blog</a>
          </li>
      </ul>

  </div>
</div>



      <div id="start-of-content" class="accessibility-aid"></div>
          <div class="site" itemscope itemtype="http://schema.org/WebPage">
    <div id="js-flash-container">
      
    </div>
    <div class="pagehead repohead instapaper_ignore readability-menu">
      <div class="container">
        
<ul class="pagehead-actions">

  <li>
      <a href="/login?return_to=%2Fmindmup%2Fbootstrap-wysiwyg"
    class="minibutton with-count tooltipped tooltipped-n"
    aria-label="You must be signed in to watch a repository" rel="nofollow">
    <span class="octicon octicon-eye"></span>
    Watch
  </a>
  <a class="social-count" href="/mindmup/bootstrap-wysiwyg/watchers">
    295
  </a>


  </li>

  <li>
      <a href="/login?return_to=%2Fmindmup%2Fbootstrap-wysiwyg"
    class="minibutton with-count tooltipped tooltipped-n"
    aria-label="You must be signed in to star a repository" rel="nofollow">
    <span class="octicon octicon-star"></span>
    Star
  </a>

    <a class="social-count js-social-count" href="/mindmup/bootstrap-wysiwyg/stargazers">
      4,329
    </a>

  </li>

    <li>
      <a href="/login?return_to=%2Fmindmup%2Fbootstrap-wysiwyg"
        class="minibutton with-count tooltipped tooltipped-n"
        aria-label="You must be signed in to fork a repository" rel="nofollow">
        <span class="octicon octicon-repo-forked"></span>
        Fork
      </a>
      <a href="/mindmup/bootstrap-wysiwyg/network" class="social-count">
        1,068
      </a>
    </li>
</ul>

        <h1 itemscope itemtype="http://data-vocabulary.org/Breadcrumb" class="entry-title public">
          <span class="mega-octicon octicon-repo-forked"></span>
          <span class="author"><a href="/mindmup" class="url fn" itemprop="url" rel="author"><span itemprop="title">mindmup</span></a></span><!--
       --><span class="path-divider">/</span><!--
       --><strong><a href="/mindmup/bootstrap-wysiwyg" class="js-current-repository" data-pjax="#js-repo-pjax-container">bootstrap-wysiwyg</a></strong>

          <span class="page-context-loader">
            <img alt="" height="16" src="https://assets-cdn.github.com/assets/spinners/octocat-spinner-32-e513294efa576953719e4e2de888dd9cf929b7d62ed8d05f25e731d02452ab6c.gif" width="16" />
          </span>

            <span class="fork-flag">
              <span class="text">forked from <a href="/steveathon/bootstrap-wysiwyg">steveathon/bootstrap-wysiwyg</a></span>
            </span>
        </h1>
      </div><!-- /.container -->
    </div><!-- /.repohead -->

    <div class="container">
      <div class="repository-with-sidebar repo-container new-discussion-timeline  ">
        <div class="repository-sidebar clearfix">
            
<nav class="sunken-menu repo-nav js-repo-nav js-sidenav-container-pjax js-octicon-loaders"
     role="navigation"
     data-pjax="#js-repo-pjax-container"
     data-issue-count-url="/mindmup/bootstrap-wysiwyg/issues/counts">
  <ul class="sunken-menu-group">
    <li class="tooltipped tooltipped-w" aria-label="Code">
      <a href="/mindmup/bootstrap-wysiwyg" aria-label="Code" class="selected js-selected-navigation-item sunken-menu-item" data-hotkey="g c" data-selected-links="repo_source repo_downloads repo_commits repo_releases repo_tags repo_branches /mindmup/bootstrap-wysiwyg">
        <span class="octicon octicon-code"></span> <span class="full-word">Code</span>
        <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/assets/spinners/octocat-spinner-32-e513294efa576953719e4e2de888dd9cf929b7d62ed8d05f25e731d02452ab6c.gif" width="16" />
</a>    </li>

      <li class="tooltipped tooltipped-w" aria-label="Issues">
        <a href="/mindmup/bootstrap-wysiwyg/issues" aria-label="Issues" class="js-selected-navigation-item sunken-menu-item" data-hotkey="g i" data-selected-links="repo_issues repo_labels repo_milestones /mindmup/bootstrap-wysiwyg/issues">
          <span class="octicon octicon-issue-opened"></span> <span class="full-word">Issues</span>
          <span class="js-issue-replace-counter"></span>
          <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/assets/spinners/octocat-spinner-32-e513294efa576953719e4e2de888dd9cf929b7d62ed8d05f25e731d02452ab6c.gif" width="16" />
</a>      </li>

    <li class="tooltipped tooltipped-w" aria-label="Pull Requests">
      <a href="/mindmup/bootstrap-wysiwyg/pulls" aria-label="Pull Requests" class="js-selected-navigation-item sunken-menu-item" data-hotkey="g p" data-selected-links="repo_pulls /mindmup/bootstrap-wysiwyg/pulls">
          <span class="octicon octicon-git-pull-request"></span> <span class="full-word">Pull Requests</span>
          <span class="js-pull-replace-counter"></span>
          <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/assets/spinners/octocat-spinner-32-e513294efa576953719e4e2de888dd9cf929b7d62ed8d05f25e731d02452ab6c.gif" width="16" />
</a>    </li>


      <li class="tooltipped tooltipped-w" aria-label="Wiki">
        <a href="/mindmup/bootstrap-wysiwyg/wiki" aria-label="Wiki" class="js-selected-navigation-item sunken-menu-item" data-hotkey="g w" data-selected-links="repo_wiki /mindmup/bootstrap-wysiwyg/wiki">
          <span class="octicon octicon-book"></span> <span class="full-word">Wiki</span>
          <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/assets/spinners/octocat-spinner-32-e513294efa576953719e4e2de888dd9cf929b7d62ed8d05f25e731d02452ab6c.gif" width="16" />
</a>      </li>
  </ul>
  <div class="sunken-menu-separator"></div>
  <ul class="sunken-menu-group">

    <li class="tooltipped tooltipped-w" aria-label="Pulse">
      <a href="/mindmup/bootstrap-wysiwyg/pulse" aria-label="Pulse" class="js-selected-navigation-item sunken-menu-item" data-selected-links="pulse /mindmup/bootstrap-wysiwyg/pulse">
        <span class="octicon octicon-pulse"></span> <span class="full-word">Pulse</span>
        <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/assets/spinners/octocat-spinner-32-e513294efa576953719e4e2de888dd9cf929b7d62ed8d05f25e731d02452ab6c.gif" width="16" />
</a>    </li>

    <li class="tooltipped tooltipped-w" aria-label="Graphs">
      <a href="/mindmup/bootstrap-wysiwyg/graphs" aria-label="Graphs" class="js-selected-navigation-item sunken-menu-item" data-selected-links="repo_graphs repo_contributors /mindmup/bootstrap-wysiwyg/graphs">
        <span class="octicon octicon-graph"></span> <span class="full-word">Graphs</span>
        <img alt="" class="mini-loader" height="16" src="https://assets-cdn.github.com/assets/spinners/octocat-spinner-32-e513294efa576953719e4e2de888dd9cf929b7d62ed8d05f25e731d02452ab6c.gif" width="16" />
</a>    </li>
  </ul>


</nav>

              <div class="only-with-full-nav">
                  
<div class="clone-url open"
  data-protocol-type="http"
  data-url="/users/set_protocol?protocol_selector=http&amp;protocol_type=clone">
  <h3><span class="text-emphasized">HTTPS</span> clone URL</h3>
  <div class="input-group js-zeroclipboard-container">
    <input type="text" class="input-mini input-monospace js-url-field js-zeroclipboard-target"
           value="https://github.com/mindmup/bootstrap-wysiwyg.git" readonly="readonly">
    <span class="input-group-button">
      <button aria-label="Copy to clipboard" class="js-zeroclipboard minibutton zeroclipboard-button" data-copied-hint="Copied!" type="button"><span class="octicon octicon-clippy"></span></button>
    </span>
  </div>
</div>

  
<div class="clone-url "
  data-protocol-type="subversion"
  data-url="/users/set_protocol?protocol_selector=subversion&amp;protocol_type=clone">
  <h3><span class="text-emphasized">Subversion</span> checkout URL</h3>
  <div class="input-group js-zeroclipboard-container">
    <input type="text" class="input-mini input-monospace js-url-field js-zeroclipboard-target"
           value="https://github.com/mindmup/bootstrap-wysiwyg" readonly="readonly">
    <span class="input-group-button">
      <button aria-label="Copy to clipboard" class="js-zeroclipboard minibutton zeroclipboard-button" data-copied-hint="Copied!" type="button"><span class="octicon octicon-clippy"></span></button>
    </span>
  </div>
</div>



<p class="clone-options">You can clone with
  <a href="#" class="js-clone-selector" data-protocol="http">HTTPS</a> or <a href="#" class="js-clone-selector" data-protocol="subversion">Subversion</a>.
  <a href="https://help.github.com/articles/which-remote-url-should-i-use" class="help tooltipped tooltipped-n" aria-label="Get help on which URL is right for you.">
    <span class="octicon octicon-question"></span>
  </a>
</p>

  <a href="http://mac.github.com" data-url="github-mac://openRepo/https://github.com/mindmup/bootstrap-wysiwyg" class="minibutton sidebar-button js-conduit-rewrite-url" title="Save mindmup/bootstrap-wysiwyg to your computer and use it in GitHub Desktop." aria-label="Save mindmup/bootstrap-wysiwyg to your computer and use it in GitHub Desktop.">
    <span class="octicon octicon-device-desktop"></span>
    Clone in Desktop
  </a>


                <a href="/mindmup/bootstrap-wysiwyg/archive/master.zip"
                   class="minibutton sidebar-button"
                   aria-label="Download the contents of mindmup/bootstrap-wysiwyg as a zip file"
                   title="Download the contents of mindmup/bootstrap-wysiwyg as a zip file"
                   rel="nofollow">
                  <span class="octicon octicon-cloud-download"></span>
                  Download ZIP
                </a>
              </div>
        </div><!-- /.repository-sidebar -->

        <div id="js-repo-pjax-container" class="repository-content context-loader-container" data-pjax-container>
          

<a href="/mindmup/bootstrap-wysiwyg/blob/9304f95917d603d813a9a9fd2670a586e5d74cde/README.md" class="hidden js-permalink-shortcut" data-hotkey="y">Permalink</a>

<!-- blob contrib key: blob_contributors:v21:e1432ee72f1f41eb6d515f1817d9d1bc -->

<div class="file-navigation js-zeroclipboard-container">
  
<div class="select-menu js-menu-container js-select-menu left">
  <span class="minibutton select-menu-button js-menu-target css-truncate" data-hotkey="w"
    data-master-branch="master"
    data-ref="master"
    title="master"
    role="button" aria-label="Switch branches or tags" tabindex="0" aria-haspopup="true">
    <span class="octicon octicon-git-branch"></span>
    <i>branch:</i>
    <span class="js-select-button css-truncate-target">master</span>
  </span>

  <div class="select-menu-modal-holder js-menu-content js-navigation-container" data-pjax aria-hidden="true">

    <div class="select-menu-modal">
      <div class="select-menu-header">
        <span class="select-menu-title">Switch branches/tags</span>
        <span class="octicon octicon-x js-menu-close" role="button" aria-label="Close"></span>
      </div>

      <div class="select-menu-filters">
        <div class="select-menu-text-filter">
          <input type="text" aria-label="Filter branches/tags" id="context-commitish-filter-field" class="js-filterable-field js-navigation-enable" placeholder="Filter branches/tags">
        </div>
        <div class="select-menu-tabs">
          <ul>
            <li class="select-menu-tab">
              <a href="#" data-tab-filter="branches" data-filter-placeholder="Filter branches/tags" class="js-select-menu-tab">Branches</a>
            </li>
            <li class="select-menu-tab">
              <a href="#" data-tab-filter="tags" data-filter-placeholder="Find a tag…" class="js-select-menu-tab">Tags</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="select-menu-list select-menu-tab-bucket js-select-menu-tab-bucket" data-tab-filter="branches">

        <div data-filterable-for="context-commitish-filter-field" data-filterable-type="substring">


            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/mindmup/bootstrap-wysiwyg/blob/gh-pages/README.md"
                 data-name="gh-pages"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="gh-pages">gh-pages</a>
            </div>
            <div class="select-menu-item js-navigation-item selected">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/mindmup/bootstrap-wysiwyg/blob/master/README.md"
                 data-name="master"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text css-truncate-target"
                 title="master">master</a>
            </div>
        </div>

          <div class="select-menu-no-results">Nothing to show</div>
      </div>

      <div class="select-menu-list select-menu-tab-bucket js-select-menu-tab-bucket" data-tab-filter="tags">
        <div data-filterable-for="context-commitish-filter-field" data-filterable-type="substring">


        </div>

        <div class="select-menu-no-results">Nothing to show</div>
      </div>

    </div>
  </div>
</div>

  <div class="button-group right">
    <a href="/mindmup/bootstrap-wysiwyg/find/master"
          class="js-show-file-finder minibutton empty-icon tooltipped tooltipped-s"
          data-pjax
          data-hotkey="t"
          aria-label="Quickly jump between files">
      <span class="octicon octicon-list-unordered"></span>
    </a>
    <button aria-label="Copy file path to clipboard" class="js-zeroclipboard minibutton zeroclipboard-button" data-copied-hint="Copied!" type="button"><span class="octicon octicon-clippy"></span></button>
  </div>

  <div class="breadcrumb js-zeroclipboard-target">
    <span class='repo-root js-repo-root'><span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/mindmup/bootstrap-wysiwyg" class="" data-branch="master" data-direction="back" data-pjax="true" itemscope="url"><span itemprop="title">bootstrap-wysiwyg</span></a></span></span><span class="separator">/</span><strong class="final-path">README.md</strong>
  </div>
</div>


  <div class="commit file-history-tease">
    <div class="file-history-tease-header">
        <img alt="Alexey Bobyrev" class="avatar" data-user="469230" height="24" src="https://avatars1.githubusercontent.com/u/469230?v=3&amp;s=48" width="24" />
        <span class="author"><a href="/sfate" rel="contributor">sfate</a></span>
        <time datetime="2013-04-17T12:23:01Z" is="relative-time">Apr 17, 2013</time>
        <div class="commit-title">
            <a href="/mindmup/bootstrap-wysiwyg/commit/a5c247f54b37d7bf39ed9febda28e17b71db4a17" class="message" data-pjax="true" title="Add code highlight in readme">Add code highlight in readme</a>
        </div>
    </div>

    <div class="participation">
      <p class="quickstat">
        <a href="#blob_contributors_box" rel="facebox">
          <strong>2</strong>
           contributors
        </a>
      </p>
          <a class="avatar-link tooltipped tooltipped-s" aria-label="gojko" href="/mindmup/bootstrap-wysiwyg/commits/master/README.md?author=gojko"><img alt="Gojko Adzic" class="avatar" data-user="38767" height="20" src="https://avatars1.githubusercontent.com/u/38767?v=3&amp;s=40" width="20" /></a>
    <a class="avatar-link tooltipped tooltipped-s" aria-label="sfate" href="/mindmup/bootstrap-wysiwyg/commits/master/README.md?author=sfate"><img alt="Alexey Bobyrev" class="avatar" data-user="469230" height="20" src="https://avatars3.githubusercontent.com/u/469230?v=3&amp;s=40" width="20" /></a>


    </div>
    <div id="blob_contributors_box" style="display:none">
      <h2 class="facebox-header">Users who have contributed to this file</h2>
      <ul class="facebox-user-list">
          <li class="facebox-user-list-item">
            <img alt="Gojko Adzic" data-user="38767" height="24" src="https://avatars3.githubusercontent.com/u/38767?v=3&amp;s=48" width="24" />
            <a href="/gojko">gojko</a>
          </li>
          <li class="facebox-user-list-item">
            <img alt="Alexey Bobyrev" data-user="469230" height="24" src="https://avatars1.githubusercontent.com/u/469230?v=3&amp;s=48" width="24" />
            <a href="/sfate">sfate</a>
          </li>
      </ul>
    </div>
  </div>

<div class="file-box">
  <div class="file">
    <div class="meta clearfix">
      <div class="info file-name">
          <span>86 lines (68 sloc)</span>
          <span class="meta-divider"></span>
        <span>3.695 kb</span>
      </div>
      <div class="actions">
        <div class="button-group">
          <a href="/mindmup/bootstrap-wysiwyg/raw/master/README.md" class="minibutton " id="raw-url">Raw</a>
            <a href="/mindmup/bootstrap-wysiwyg/blame/master/README.md" class="minibutton js-update-url-with-hash">Blame</a>
          <a href="/mindmup/bootstrap-wysiwyg/commits/master/README.md" class="minibutton " rel="nofollow">History</a>
        </div><!-- /.button-group -->

          <a class="octicon-button tooltipped tooltipped-nw js-conduit-openfile-check"
             href="http://mac.github.com"
             data-url="github-mac://openRepo/https://github.com/mindmup/bootstrap-wysiwyg?branch=master&amp;filepath=README.md"
             aria-label="Open this file in GitHub for Mac"
             data-failed-title="Your version of GitHub for Mac is too old to open this file. Try checking for updates.">
              <span class="octicon octicon-device-desktop"></span>
          </a>

            <a class="octicon-button disabled tooltipped tooltipped-w" href="#"
               aria-label="You must be signed in to make or propose changes"><span class="octicon octicon-pencil"></span></a>

          <a class="octicon-button danger disabled tooltipped tooltipped-w" href="#"
             aria-label="You must be signed in to make or propose changes">
          <span class="octicon octicon-trashcan"></span>
        </a>
      </div><!-- /.actions -->
    </div>
    
  <div id="readme" class="blob instapaper_body">
    <article class="markdown-body entry-content" itemprop="mainContentOfPage"><h1>
<a id="user-content-bootstrap-wysiwyg" class="anchor" href="#bootstrap-wysiwyg" aria-hidden="true"><span class="octicon octicon-link"></span></a>bootstrap-wysiwyg</h1>

<p>Tiny bootstrap-compatible WISWYG rich text editor, based on browser execCommand, built originally for <a href="http://www.mindmup.com">MindMup</a>. Here are the key features:</p>

<ul class="task-list">
<li>Automatically binds standard hotkeys for common operations on Mac and Windows</li>
<li>Drag and drop files to insert images, support image upload (also taking photos on mobile devices)</li>
<li>Allows a custom built toolbar, no magic markup generators, enabling the web site to use all the goodness of Bootstrap, Font Awesome and so on...</li>
<li>Does not force any styling - it's all up to you</li>
<li>Uses standard browser features, no magic non-standard code, toolbar and keyboard configurable to execute any supported <a href="https://developer.mozilla.org/en/docs/Rich-Text_Editing_in_Mozilla">browser command</a>
</li>
<li>Does not create a separate frame, backup text areas etc - instead keeps it simple and runs everything inline in a DIV</li>
<li>(Optionally) cleans up trailing whitespace and empty divs and spans</li>
<li>Requires a modern browser (tested in Chrome 26, Firefox 19, Safari 6)</li>
<li>Supports mobile devices (tested on IOS 6 Ipad/Iphone and Android 4.1.1 Chrome)</li>
</ul>

<h2>
<a id="user-content-basic-usage" class="anchor" href="#basic-usage" aria-hidden="true"><span class="octicon octicon-link"></span></a>Basic Usage</h2>

<p>See <a href="http://mindmup.github.com/bootstrap-wysiwyg/">http://mindmup.github.com/bootstrap-wysiwyg/</a></p>

<h2>
<a id="user-content-customising" class="anchor" href="#customising" aria-hidden="true"><span class="octicon octicon-link"></span></a>Customising</h2>

<p>You can assign commands to hotkeys and toolbar links. For a toolbar link, just put the execCommand command name into a data-edit attribute.
For more info on execCommand, see <a href="http://www.quirksmode.org/dom/execCommand.html">http://www.quirksmode.org/dom/execCommand.html</a> and <a href="https://developer.mozilla.org/en/docs/Rich-Text_Editing_in_Mozilla">https://developer.mozilla.org/en/docs/Rich-Text_Editing_in_Mozilla</a></p>

<div class="highlight highlight-html"><pre>&lt;<span class="pl-ent">div</span> <span class="pl-e">class</span>=<span class="pl-s1"><span class="pl-pds">"</span>btn-toolbar<span class="pl-pds">"</span></span> <span class="pl-e">data-role</span>=<span class="pl-s1"><span class="pl-pds">"</span>editor-toolbar<span class="pl-pds">"</span></span> <span class="pl-e">data-target</span>=<span class="pl-s1"><span class="pl-pds">"</span>#editor<span class="pl-pds">"</span></span>&gt;
  &lt;<span class="pl-ent">a</span> <span class="pl-e">class</span>=<span class="pl-s1"><span class="pl-pds">"</span>btn btn-large<span class="pl-pds">"</span></span> <span class="pl-e">data-edit</span>=<span class="pl-s1"><span class="pl-pds">"</span>bold<span class="pl-pds">"</span></span>&gt;&lt;<span class="pl-ent">i</span> <span class="pl-e">class</span>=<span class="pl-s1"><span class="pl-pds">"</span>icon-bold<span class="pl-pds">"</span></span>&gt;&lt;/<span class="pl-ent">i</span>&gt;&lt;/<span class="pl-ent">a</span>&gt;
&lt;/<span class="pl-ent">div</span>&gt;</pre></div>

<p>To pass arguments to a command, separate a command with a space.</p>

<div class="highlight highlight-html"><pre>  &lt;<span class="pl-ent">a</span> <span class="pl-e">data-edit</span>=<span class="pl-s1"><span class="pl-pds">"</span>fontName Arial<span class="pl-pds">"</span></span>&gt;...&lt;/<span class="pl-ent">a</span>&gt;</pre></div>

<p>You can also use input type='text' with a data-edit attribute. When the value
is changed, the command from the data-edit attribute will be applied using the
input value as the command argument</p>

<div class="highlight highlight-html"><pre>&lt;<span class="pl-ent">input</span> <span class="pl-e">type</span>=<span class="pl-s1"><span class="pl-pds">"</span>text<span class="pl-pds">"</span></span> <span class="pl-e">data-edit</span>=<span class="pl-s1"><span class="pl-pds">"</span>createLink<span class="pl-pds">"</span></span>&gt;</pre></div>

<p>If the input type is file, when a file is selected the contents will be read in using the FileReader API and the data URL will be used as the argument</p>

<div class="highlight highlight-html"><pre>&lt;<span class="pl-ent">input</span> <span class="pl-e">type</span>=<span class="pl-s1"><span class="pl-pds">"</span>file<span class="pl-pds">"</span></span> <span class="pl-e">data-edit</span>=<span class="pl-s1"><span class="pl-pds">"</span>insertImage<span class="pl-pds">"</span></span>&gt;</pre></div>

<p>To change hotkeys, specify the map of hotkeys to commands in the hotKeys option. For example:</p>

<div class="highlight highlight-javascript"><pre>$(<span class="pl-s1"><span class="pl-pds">'</span>#editor<span class="pl-pds">'</span></span>).wysiwyg({
  hotKeys<span class="pl-k">:</span> {
    <span class="pl-s1"><span class="pl-pds">'</span>ctrl+b meta+b<span class="pl-pds">'</span></span><span class="pl-k">:</span> <span class="pl-s1"><span class="pl-pds">'</span>bold<span class="pl-pds">'</span></span>,
    <span class="pl-s1"><span class="pl-pds">'</span>ctrl+i meta+i<span class="pl-pds">'</span></span><span class="pl-k">:</span> <span class="pl-s1"><span class="pl-pds">'</span>italic<span class="pl-pds">'</span></span>,
    <span class="pl-s1"><span class="pl-pds">'</span>ctrl+u meta+u<span class="pl-pds">'</span></span><span class="pl-k">:</span> <span class="pl-s1"><span class="pl-pds">'</span>underline<span class="pl-pds">'</span></span>,
    <span class="pl-s1"><span class="pl-pds">'</span>ctrl+z meta+z<span class="pl-pds">'</span></span><span class="pl-k">:</span> <span class="pl-s1"><span class="pl-pds">'</span>undo<span class="pl-pds">'</span></span>,
    <span class="pl-s1"><span class="pl-pds">'</span>ctrl+y meta+y meta+shift+z<span class="pl-pds">'</span></span><span class="pl-k">:</span> <span class="pl-s1"><span class="pl-pds">'</span>redo<span class="pl-pds">'</span></span>
  }
});</pre></div>

<h2>
<a id="user-content-styling-for-mobile-devices" class="anchor" href="#styling-for-mobile-devices" aria-hidden="true"><span class="octicon octicon-link"></span></a>Styling for mobile devices</h2>

<p>This editor should work pretty well with mobile devices, but you'll need to consider the following things when styling it:</p>

<ul class="task-list">
<li>keyboards on mobile devices take a huge part of the screen</li>
<li>having to scroll the screen to touch the toolbar can cause the editing component to lose focus, and the mobile device keyboard might go away</li>
<li>mobile devices tend to move the screen viewport around to ensure that the focused element is shown, so it's best that the edit box is glued to the top</li>
</ul>

<p>For the content attachment editor on MindMup, we apply the following rules to mobile device styling:</p>

<ul class="task-list">
<li>edit box is glued to the top, so the focus doesn't jump around</li>
<li>toolbar is below the edit box</li>
<li>on portrait screens, edit box size is 50% of the screen</li>
<li>on landscape screens, edit box size is 30% of the screen</li>
<li>as the screen gets smaller, non-critical toolbar buttons get hidden into a "other" menu</li>
</ul>

<h2>
<a id="user-content-dependencies" class="anchor" href="#dependencies" aria-hidden="true"><span class="octicon octicon-link"></span></a>Dependencies</h2>

<ul class="task-list">
<li>jQuery <a href="http://jquery.com/">http://jquery.com/</a>
</li>
<li>jQuery HotKeys <a href="https://github.com/jeresig/jquery.hotkeys">https://github.com/jeresig/jquery.hotkeys</a>
</li>
<li>Bootstrap <a href="http://twitter.github.com/bootstrap/">http://twitter.github.com/bootstrap/</a>
</li>
</ul>
</article>
  </div>

  </div>
</div>

<a href="#jump-to-line" rel="facebox[.linejump]" data-hotkey="l" style="display:none">Jump to Line</a>
<div id="jump-to-line" style="display:none">
  <form accept-charset="UTF-8" class="js-jump-to-line-form">
    <input class="linejump-input js-jump-to-line-field" type="text" placeholder="Jump to line&hellip;" autofocus>
    <button type="submit" class="button">Go</button>
  </form>
</div>

        </div>

      </div><!-- /.repo-container -->
      <div class="modal-backdrop"></div>
    </div><!-- /.container -->
  </div><!-- /.site -->


    </div><!-- /.wrapper -->

      <div class="container">
  <div class="site-footer" role="contentinfo">
    <ul class="site-footer-links right">
        <li><a href="https://status.github.com/" data-ga-click="Footer, go to status, text:status">Status</a></li>
      <li><a href="https://developer.github.com" data-ga-click="Footer, go to api, text:api">API</a></li>
      <li><a href="http://training.github.com" data-ga-click="Footer, go to training, text:training">Training</a></li>
      <li><a href="http://shop.github.com" data-ga-click="Footer, go to shop, text:shop">Shop</a></li>
        <li><a href="/blog" data-ga-click="Footer, go to blog, text:blog">Blog</a></li>
        <li><a href="/about" data-ga-click="Footer, go to about, text:about">About</a></li>

    </ul>

    <a href="/" aria-label="Homepage">
      <span class="mega-octicon octicon-mark-github" title="GitHub"></span>
    </a>

    <ul class="site-footer-links">
      <li>&copy; 2015 <span title="0.03706s from github-fe135-cp1-prd.iad.github.net">GitHub</span>, Inc.</li>
        <li><a href="/site/terms" data-ga-click="Footer, go to terms, text:terms">Terms</a></li>
        <li><a href="/site/privacy" data-ga-click="Footer, go to privacy, text:privacy">Privacy</a></li>
        <li><a href="/security" data-ga-click="Footer, go to security, text:security">Security</a></li>
        <li><a href="/contact" data-ga-click="Footer, go to contact, text:contact">Contact</a></li>
    </ul>
  </div>
</div>


    <div class="fullscreen-overlay js-fullscreen-overlay" id="fullscreen_overlay">
  <div class="fullscreen-container js-suggester-container">
    <div class="textarea-wrap">
      <textarea name="fullscreen-contents" id="fullscreen-contents" class="fullscreen-contents js-fullscreen-contents" placeholder=""></textarea>
      <div class="suggester-container">
        <div class="suggester fullscreen-suggester js-suggester js-navigation-container"></div>
      </div>
    </div>
  </div>
  <div class="fullscreen-sidebar">
    <a href="#" class="exit-fullscreen js-exit-fullscreen tooltipped tooltipped-w" aria-label="Exit Zen Mode">
      <span class="mega-octicon octicon-screen-normal"></span>
    </a>
    <a href="#" class="theme-switcher js-theme-switcher tooltipped tooltipped-w"
      aria-label="Switch themes">
      <span class="octicon octicon-color-mode"></span>
    </a>
  </div>
</div>



    

    <div id="ajax-error-message" class="flash flash-error">
      <span class="octicon octicon-alert"></span>
      <a href="#" class="octicon octicon-x flash-close js-ajax-error-dismiss" aria-label="Dismiss error"></a>
      Something went wrong with that request. Please try again.
    </div>


      <script crossorigin="anonymous" src="https://assets-cdn.github.com/assets/frameworks-996268c2962f947579cb9ec2908bd576591bc94b6a2db184a78e78815022ba2c.js"></script>
      <script async="async" crossorigin="anonymous" src="https://assets-cdn.github.com/assets/github-370a7761587efb85fef26954a70aaf65e0364d73ad3de1106bd90c1fd2a82a98.js"></script>
      
      

  </body>
</html>

