module ApiGen
    class ApiGenerator < Jekyll::Generator
        safe true

        def generate(site)
            site.data['tsdoc']['children'].each do |child|
                site.pages << ApiPage.new(site, site.data['tsdoc'], child['name'])
            end
        end
    end

    class ApiPage < Jekyll::Page
        def initialize(site, tsdoc, child_name)
            @site = site
            @base = site.source
            @dir = 'api/' + child_name + '/'

            @basename = 'index'
            @ext = '.html'
            @name = 'index.html'

            # Available under 'page' object
            @data = {
                'layout' => 'base',
                'title' => child_name,
                'type' => child_name,
            }

            base_path = File.join(@site.source, '_plugins')
            self.read_yaml(base_path, 'api-page-template.html')
        end
    end
end
