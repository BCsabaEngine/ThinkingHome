/* eslint-disable no-useless-escape */
const url = require('url')

module.exports = {

  FwQueryStrings: [
    '([a-z0-9]{2000,})',
    '(/|%2f)(:|%3a)(/|%2f)',
    '(/|%2f)(\\*|%2a)(\\*|%2a)(/|%2f)',
    '(~|`|<|>|\^|\|\\|0x00|%00|%0d%0a)',
    '(cmd|command)(=|%3d)(chdir|mkdir)(.*)(x20)',
    '(fck|ckfinder|fullclick|ckfinder|fckeditor)',
    '(.php|myadmin|wordpress|wp-)',
    '(/|%2f)((wp-)?config)((\.|%2e)inc)?((\.|%2e)php)',
    '(thumbs?(_editor|open)?|tim(thumbs?)?)((\.|%2e)php)',
    '(absolute_|base|root_)(dir|path)(=|%3d)(ftp|https?)',
    '(localhost|loopback|127(\.|%2e)0(\.|%2e)0(\.|%2e)1)',
    // '(\.|20)(get|the)(_|%5f)(permalink|posts_page_url)(\(|%28)',
    '(s)?(ftp|http|inurl|php)(s)?(:(/|%2f|%u2215)(/|%2f|%u2215))',
    '(globals|mosconfig([a-z_]{1,22})|request)(=|\[|%[a-z0-9]{0,2})',
    '((boot|win)((\.|%2e)ini)|etc(/|%2f)passwd|self(/|%2f)environ)',
    '(((/|%2f){3,3})|((\.|%2e){3,3})|((\.|%2e){2,2})(/|%2f|%u2215))',
    '(benchmark|char|exec|fopen|function|html)(.*)(\(|%28)(.*)(\)|%29)',
    '(php)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})',
    '(e|%65|%45)(v|%76|%56)(a|%61|%31)(l|%6c|%4c)(.*)(\(|%28)(.*)(\)|%29)',
    '(/|%2f)(=|%3d|$&|_mm|cgi(\.|-)|inurl(:|%3a)(/|%2f)|(mod|path)(=|%3d)(\.|%2e))',
    '(<|%3c)(.*)(e|%65|%45)(m|%6d|%4d)(b|%62|%42)(e|%65|%45)(d|%64|%44)(.*)(>|%3e)',
    '(<|%3c)(.*)(i|%69|%49)(f|%66|%46)(r|%72|%52)(a|%61|%41)(m|%6d|%4d)(e|%65|%45)(.*)(>|%3e)',
    '(<|%3c)(.*)(o|%4f|%6f)(b|%62|%42)(j|%4a|%6a)(e|%65|%45)(c|%63|%43)(t|%74|%54)(.*)(>|%3e)',
    '(<|%3c)(.*)(s|%73|%53)(c|%63|%43)(r|%72|%52)(i|%69|%49)(p|%70|%50)(t|%74|%54)(.*)(>|%3e)',
    // '(\+|%2b|%20)(d|%64|%44)(e|%65|%45)(l|%6c|%4c)(e|%65|%45)(t|%74|%54)(e|%65|%45)(\+|%2b|%20)',
    // '(\+|%2b|%20)(i|%69|%49)(n|%6e|%4e)(s|%73|%53)(e|%65|%45)(r|%72|%52)(t|%74|%54)(\+|%2b|%20)',
    // '(\+|%2b|%20)(s|%73|%53)(e|%65|%45)(l|%6c|%4c)(e|%65|%45)(c|%63|%43)(t|%74|%54)(\+|%2b|%20)',
    // '(\+|%2b|%20)(u|%75|%55)(p|%70|%50)(d|%64|%44)(a|%61|%41)(t|%74|%54)(e|%65|%45)(\+|%2b|%20)',
    // '(\\x00|(\"|%22|\'|%27)?0(\"|%22|\'|%27)?(=|%3d)(\"|%22|\'|%27)?0|cast(\(|%28)0x|or%201(=|%3d)1)',
    '(g|%67|%47)(l|%6c|%4c)(o|%6f|%4f)(b|%62|%42)(a|%61|%41)(l|%6c|%4c)(s|%73|%53)(=|[|%[0-9A-Z]{0,2})',
    '(_|%5f)(r|%72|%52)(e|%65|%45)(q|%71|%51)(u|%75|%55)(e|%65|%45)(s|%73|%53)(t|%74|%54)(=|[|%[0-9A-Z]{0,2})',
    // '(j|%6a|%4a)(a|%61|%41)(v|%76|%56)(a|%61|%31)(s|%73|%53)(c|%63|%43)(r|%72|%52)(i|%69|%49)(p|%70|%50)(t|%74|%54)(:|%3a)(.*)(;|%3b|\)|%29)',
    '(b|%62|%42)(a|%61|%41)(s|%73|%53)(e|%65|%45)(6|%36)(4|%34)(_|%5f)(e|%65|%45|d|%64|%44)(e|%65|%45|n|%6e|%4e)(c|%63|%43)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(.*)(\()(.*)(\))',
    '(allow_url_(fopen|include)|auto_prepend_file|blexbot|browsersploit|(c99|php)shell|curltest|disable_functions?|document_root|elastix|encodeuricom|exec|exploit|fclose|fgets|fputs|fsbuff|fsockopen|gethostbyname|grablogin|hmei7|input_file|load_file|null|open_basedir|outfile|passthru|popen|proc_open|quickbrute|remoteview|root_path|safe_mode|shell_exec|site((.){0,2})copier|sux0r|trojan|wget|xertive)'
    // '(;|<|>|\'|\"|\)|%0a|%0d|%22|%27|%3c|%3e|%00)(.*)(/\*|alter|base64|benchmark|cast|char|concat|convert|create|encode|declare|delete|drop|insert|md5|order|request|script|select|set|union|update)',
    // '((\+|%2b)(concat|delete|get|select|union)(\+|%2b))',
    // '(union)(.*)(select)(.*)(\(|%28)',
    // '(concat)(.*)(\(|%28)',
  ],

  FwRequestUri: [
    '([a-z0-9]{2000,})',
    '(=?\(\'|%27)/?)(\.)',
    // '(/)(\\*|\"|\'|\.|,|&|&amp;?)/?$',
    '(\.)(php)(\()?([0-9]+)(\))?(/)?$',
    '(/)(vbulletin|boards|vbforum)(/)?',
    // '(\^|~|`|<|>|,|%|\\|\{|\}|\[|\]|\|)',
    '(\.(s?ftp-?)config|(s?ftp-?)config\.)',
    // '(\{0\}|\"?0\"?=\"?0|\(/\(|\.\.\.|\+\+\+|\\\")',
    '(thumbs?(_editor|open)?|tim(thumbs?)?)(\.php)',
    '(/)(fck|ckfinder|fullclick|ckfinder|fckeditor)',
    // '(\.|20)(get|the)(_)(permalink|posts_page_url)(\()',
    // '(///|\?\?|/&&|/\*(.*)\*/|/:/|\\\\|0x00|%00|%0d%0a)',
    '(/%7e)(root|ftp|bin|nobody|named|guest|logs|sshd)(/)',
    '(/)(etc|var)(/)(hidden|secret|shadow|ninja|passwd|tmp)(/)?$',
    '(s)?(ftp|http|inurl|php)(s)?(:(/|%2f|%u2215)(/|%2f|%u2215))',
    // '(/)(=|\$&?|&?(pws|rk)=0|_mm|_vti_|cgi(\.|-)?|(=|/|;|,)nt\.)',
    '(\.)(conf(ig)?|ds_store|htaccess|htpasswd|init?|mysql-select-db)(/)?$',
    '(/)(bin)(/)(cc|chmod|chsh|cpp|echo|id|kill|mail|nasm|perl|ping|ps|python|tclsh)(/)?$',
    '(/)(::[0-9999]|%3a%3a[0-9999]|127\.0\.0\.1|localhost|loopback|makefile|pingserver|wwwroot)(/)?',
    // '(\(null\)|\{\$itemURL\}|cAsT\(0x|echo(.*)kae|etc/passwd|eval\(|self/environ|\+union\+all\+select)',
    '(/)(awstats|(c99|php|web)shell|document_root|error_log|listinfo|muieblack|remoteview|site((.){0,2})copier|sqlpatch|sux0r)',
    // '(/)((php|web)?shell|conf(ig)?|crossdomain|fileditor|locus7|nstview|php(get|remoteview|writer)|r57|remview|sshphp|storm7|webadmin)(.*)(\.|\()',
    '(/)(author-panel|bitrix|class|database|(db|mysql)-?admin|filemanager|htdocs|httpdocs|https?|mailman|mailto|msoffice|mysql|_?php-?my-?admin(.*)|sql|system|tmp|undefined|usage|var|vhosts|webmaster|www)(/)',
    '(base64_(en|de)code|benchmark|child_terminate|e?chr|eval|exec|function|fwrite|(f|p)open|html|leak|passthru|p?fsockopen|phpinfo|posix_(kill|mkfifo|setpgid|setsid|setuid)|proc_(close|get_status|nice|open|terminate)|(shell_)?exec|system)(.*)(\()(.*)(\))',
    '(\.)(7z|ab4|afm|aspx?|bash|ba?k?|bz2|cfg|cfml?|cgi|conf(ig)?|ctl|dat|db|dll|eml|et2|exe|fec|fla|hg|inc|ini|inv|jsp|log|lqd|mbf|mdb|mmw|mny|old|one|out|passwd|pdb|pl|psd|pst|ptdb|pwd|py|qbb|qdf|rar|rdf|sdb|sql|sh|soa|swf|swl|swp|stx|tar|tax|tgz|tls|tmd|wow|zlib)$',
    '(/)(^$|00.temp00|0day|3xp|70bex?|admin_events|bkht|(php|web)?shell|configbak|curltest|db|dompdf|filenetworks|hmei7|index\.php/index\.php/index|jahat|kcrew|keywordspy|mobiquo|mysql|nessus|php-?info|racrew|sql|ucp|webconfig|(wp-)?conf(ig)?(uration)?|xertive)(\.php)'
  ],

  FwUserAgent: [
    '([a-z0-9]{2000,})',
    '(&lt;|%0a|%0d|%27|%3c|%3e|%00|0x00)',
    '((c99|php|web)shell|remoteview|site((.){0,2})copier)',
    '(base64_decode|bin/bash|disconnect|eval|lwp-download|unserialize|\\\x22)',
    '(360Spider|acapbot|acoonbot|ahrefs|alexibot|asterias|attackbot|backdorbot|becomebot|binlar|blackwidow|blekkobot|blexbot|blowfish|bullseye|bunnys|butterfly|careerbot|casper|checkpriv|cheesebot|cherrypick|chinaclaw|choppy|clshttp|cmsworld|copernic|copyrightcheck|cosmos|crescent|cy_cho|datacha|demon|diavol|discobot|dittospyder|dotbot|dotnetdotcom|dumbot|emailcollector|emailsiphon|emailwolf|exabot|extract|eyenetie|feedfinder|flaming|flashget|flicky|foobot|g00g1e|getright|gigabot|go-ahead-got|gozilla|grabnet|grafula|harvest|heritrix|httrack|icarus6j|jetbot|jetcar|jikespider|kmccrew|leechftp|libweb|linkextractor|linkscan|linkwalker|loader|miner|majestic|mechanize|mj12bot|morfeus|moveoverbot|netmechanic|netspider|nicerspro|nikto|ninja|nutch|octopus|pagegrabber|planetwork|postrank|proximic|purebot|pycurl|python|queryn|queryseeker|radian6|radiation|realdownload|rogerbot|scooter|seekerspider|semalt|seznambot|siclab|sindice|sistrix|sitebot|siteexplorer|sitesnagger|skygrid|smartdownload|snoopy|sosospider|spankbot|spbot|sqlmap|stackrambler|stripper|sucker|surftbot|sux0r|suzukacz|suzuran|takeout|teleport|telesoft|true_robots|turingos|turnit|vampire|vikspider|voideye|webleacher|webreaper|webstripper|webvac|webviewer|webwhacker|winhttp|wwwoffle|woxbot|xaldon|xxxyy|yamanalab|yioopbot|youda|zeus|zmeu|zune|zyborg)'
  ],

  FwReferer: [
    '(semalt.com|todaperfeita)',
    '(ambien|blue\spill|cialis|cocaine|ejaculat|erectile|erections|hoodia|huronriveracres|impotence|levitra|libido|lipitor|phentermin|pro[sz]ac|sandyauer|tramadol|troyhamby|ultram|unicauca|valium|viagra|vicodin|xanax|ypxaieo)'
  ],

  FwMethod: [
    '^(connect|debug|delete|move|put|trace|track)'
  ],

  check: function (settings) {
    const hook = function (request, response, next) {
      const reqip = request.headers['x-forwarded-for'] || request.connection.remoteAddress
      const requrl = request.originalUrl
      if (requrl === undefined || requrl === null) {
        next()
        return
      }

      for (let i = 0; i < this.FwRequestUri.length; i++) {
        if (requrl.toLowerCase().match('^' + this.FwRequestUri[i].toLowerCase() + '$')) {
          if (typeof settings.onFailRequest === 'function') { settings.onFailRequest(reqip, requrl, this.FwRequestUri[i]) }

          return
        }
      }

      const urlParts = url.parse(requrl, true)

      let querystring = urlParts.search
      if (querystring) {
        if (querystring.startsWith('?')) { querystring = querystring.substring(1) }

        for (let i = 0; i < this.FwQueryStrings.length; i++) {
          if (querystring.toLowerCase().match('^' + this.FwQueryStrings[i].toLowerCase() + '$')) {
            if (typeof settings.onFailRequest === 'function') { settings.onFailRequest(reqip, querystring, this.FwQueryStrings[i]) }

            return
          }
        }
      }

      const useragent = request.get('User-Agent')
      if (useragent) {
        for (let i = 0; i < this.FwUserAgent.length; i++) {
          if (useragent.toLowerCase().match('^' + this.FwUserAgent[i].toLowerCase() + '$')) {
            if (typeof settings.onFailRequest === 'function') { settings.onFailRequest(reqip, useragent, this.FwUserAgent[i]) }

            return
          }
        }
      }

      const referer = request.headers.referer
      if (referer) {
        for (let i = 0; i < this.FwReferer.length; i++) {
          if (referer.toLowerCase().match('^' + this.FwReferer[i].toLowerCase() + '$')) {
            if (typeof settings.onFailRequest === 'function') { settings.onFailRequest(reqip, referer, this.FwReferer[i]) }

            return
          }
        }
      }

      const method = request.method
      for (let i = 0; i < this.FwMethod.length; i++) {
        if (method.toLowerCase().match('^' + this.FwMethod[i].toLowerCase() + '$')) {
          if (typeof settings.onFailRequest === 'function') { settings.onFailRequest(reqip, method, this.FwMethod[i]) }

          return
        }
      }

      next()
    }.bind(this)

    return hook
  }

}
