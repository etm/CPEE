require '/var/lib/gems/1.8/gems/twitter-0.6.15/lib/twitter.rb'



class Tweeter

  def tweet(what)
    httpauth = Twitter::HTTPAuth.new('r0emer', '60911333')
    client = Twitter::Base.new(httpauth)
    client.update(what)
  end
end
