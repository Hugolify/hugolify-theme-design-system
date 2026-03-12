// Global
import './utils/global';

// Add custom vendors
import './vendors/custom';

// Features
{{ if .Site.Params.animation }}
    import './features/animation';
{{ end }}
{{ if .Site.Params.carousel }}
    import './features/carousel';
{{ end }}
{{ if .Site.Params.map }}
    import './features/map';
{{ end }}
{{ if .Site.Params.parallax.enable }}
    import './features/parallax';
{{ end }}
{{ if .Site.Params.search.enable }}
    import './features/search';
{{ end }}
{{ if .Site.Params.vimeo }}
    import './features/vimeo';
{{ end }}
{{ if .Site.Params.youtube }}
    import './features/youtube';
{{ end }}

// Add custom features
import './features/custom';

// Blocks
{{ with .Site.Params.admin.blocks.enable }}
    {{ range . }}
        {{ if fileExists (print "assets/js/blocks/" . ".js") }}
            import './blocks/{{ . }}.js';
        {{ end }}
    {{ end }}
{{ else }}
    import './blocks/index.js';
{{ end }}

// Components
import './components/index';

// Add custom components
import './components/custom';
