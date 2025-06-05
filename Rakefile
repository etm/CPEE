require 'rake'
require 'rubygems/package_task'
require 'rake/testtask'

Rake::TestTask.new do |t|
  t.libs << "test"
  t.test_files = FileList['./test/tc_*.rb']
  t.verbose = false
end

spec = eval(File.read('cpee.gemspec'))
Gem::PackageTask.new(spec) do |pkg|
  pkg.need_zip = true
  pkg.need_tar = true
  puts `ls -al pkg/*`
  `rm pkg/* -rf`
  `ln -sf #{pkg.name}.gem pkg/cpee.gem`
end

task :push => :gem do |r|
  `gem push pkg/cpee.gem`
end

task :install => :gem do |r|
  `gem install pkg/cpee.gem`
end

# task :release => :gem do |r|
#   GIT_COMMITTER_DATE="$(git show develop --format=%aD | head -1)" \
#   git tag -a "v1.7.0" develop -m "tag v1.7.0" \
#   && git push --tags origin develop \
#   && git --no-pager tag --list --format='%(refname)   %(taggerdate)'
# end

desc "Clean instances"
task :clean do
  Dir.glob("server/instances/*").collect{ |i| i if i =~ /\/\d+$/ }.compact.each do |i|
    rm_rf i if File.exist?(i)
  end
end
