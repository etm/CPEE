    def notify(what,content={})# {{{
      p what

      # @pub.send_strings [@id.to_s,what,content[:activity_uuid],content.to_s]
      # p [@id.to_s,what,content[:activity_uuid],content.to_s]
      # # item = @events[what]
      # redis.publish(

      # if item
      #   item.each do |ke,ur|
      #     Thread.new(ke,ur) do |key,url|
      #       notf = build_notification(key,what,content,'event')
      #       if url.class == String
      #         client = Riddl::Client.new(url,'http://riddl.org/ns/common-patterns/notifications-consumer/1.0/consumer.xml')
      #         params = notf.map{|ke,va|Riddl::Parameter::Simple.new(ke,va)}
      #         params << Riddl::Header.new("CPEE-BASE",self.base)
      #         params << Riddl::Header.new("CPEE-INSTANCE",self.instance)
      #         params << Riddl::Header.new("CPEE-INSTANCE-URL",self.instance_url)
      #         params << Riddl::Header.new("CPEE-INSTANCE-UUID",self.uuid)
      #         client.post params
      #       elsif url.class == Riddl::Utils::Notifications::Producer::WS
      #         e = XML::Smart::string("<event/>")
      #         notf.each do |k,v|
      #           e.root.add(k,v)
      #         end
      #         url.send(e.to_s) rescue nil
      #       end
      #     end
      #   end
      # end
     end # }}}

    def call_vote(what,content={})# {{{
      voteid = Digest::MD5.hexdigest(Kernel::rand().to_s)
      # item = @votes[what]
      # if item && item.length > 0
      #   continue = WEEL::Continue.new
      #   @votes_results[voteid] = []
      #   inum = 0
      #   item.each do |key,url|
      #     if url.class == String
      #       inum += 1
      #     elsif url.class == Riddl::Utils::Notifications::Producer::WS
      #       inum += 1 unless url.closed?
      #     end
      #   end

      #   item.each do |key,url|

      #     Thread.new(key,url,content.dup) do |k,u,c|
      #       callback = Digest::MD5.hexdigest(Kernel::rand().to_s)
      #       c['callback'] = callback
      #       notf = build_notification(k,what,c,'vote',callback)
      #       if u.class == String
      #         client = Riddl::Client.new(u,'http://riddl.org/ns/common-patterns/notifications-consumer/1.0/consumer.xml')
      #         params = notf.map{|ke,va|Riddl::Parameter::Simple.new(ke,va)}
      #         params << Riddl::Header.new("CPEE-BASE",self.base_url)
      #         params << Riddl::Header.new("CPEE-INSTANCE",self.instance)
      #         params << Riddl::Header.new("CPEE-INSTANCE-URL",self.instance_url)
      #         params << Riddl::Header.new("CPEE-INSTANCE-UUID",self.uuid)
      #         params << Riddl::Header.new("CPEE-CALLBACK",self.instance_url + '/callbacks/' + callback)
      #         @mutex.synchronize do
      #           status, result, headers = client.post params
      #           if headers["CPEE_CALLBACK"] && headers["CPEE_CALLBACK"] == 'true'
      #             @callbacks[callback] = Callback.new("vote #{notf.find{|a,b| a == 'notification'}[1]}", self, :vote_callback, what, k, :http, continue, voteid, callback, inum)
      #           else
      #             vote_callback(result,nil,continue,voteid,callback,inum)
      #           end
      #         end
      #       elsif u.class == Riddl::Utils::Notifications::Producer::WS
      #         @callbacks[callback] = Callback.new("vote #{notf.find{|a,b| a == 'notification'}[1]}", self, :vote_callback, what, k, :ws, continue, voteid, callback, inum)
      #         e = XML::Smart::string("<vote/>")
      #         notf.each do |ke,va|
      #           e.root.add(ke,va)
      #         end
      #         u.send(e.to_s)
      #       end
      #     end

      #   end
      #   continue.wait

      #   !@votes_results.delete(voteid).include?(false)
      # else
      #   true
      # end
    end # }}}

  private

    def build_notification(key,what,content,type,callback=nil)# {{{
      res = []
      res << ['key'                             , key]
      res << ['topic'                           , ::File::dirname(what)]
      res << [type                              , ::File::basename(what)]
      res << ['notification'                    , ValueHelper::generate(content)]
      res << ['callback'                        , callback] unless callback.nil?
      res << ['fingerprint-with-consumer-secret', Digest::MD5.hexdigest(res.join(''))]
      # TODO add secret to fp
     end # }}}

