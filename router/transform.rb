def transform
  dsl = nil
  nots = []
  begin
    dsl   = doc.find("/p:properties/p:dsl").first
    dslx  = doc.find("/p:properties/p:dslx").first
    desc  = doc.find("/p:properties/p:description").first
    tdesc = doc.find("/p:properties/p:transformation/p:description").first
    tdata = doc.find("/p:properties/p:transformation/p:dataelements").first
    tendp = doc.find("/p:properties/p:transformation/p:endpoints").first

    tdesctype = tdesc.attributes['type']
    tdatatype = tdata.attributes['type']
    tendptype = tendp.attributes['type']

    if desc.children.empty?
      tdesctype = tdatatype = tendptype = 'clean'
    end

    ### description transformation, including dslx to dsl
    addit = if tdesctype == 'copy' || tdesc.empty?
      desc.children.first.to_doc.root
    elsif tdesctype == 'rest' && !tdesc.empty?
      srv = Riddl::Client.interface(tdesc.text,@opts[:transformation_service])
      status, res = srv.post [
        Riddl::Parameter::Complex.new("description","text/xml",desc.children.first.dump),
        Riddl::Parameter::Simple.new("type","description")
      ]
      if status >= 200 && status < 300
        XML::Smart::string(res[0].value.read).root
      else
        raise 'Could not extract dslx'
      end
    elsif tdesctype == 'xslt' && !tdesc.empty?
      trans = XML::Smart::open_unprotected(tdesc.text)
      desc.children.first.to_doc.transform_with(trans).root
    elsif tdesctype == 'clean'
      XML::Smart::open_unprotected(@opts[:empty_dslx]).root
    else
      nil
    end
    unless addit.nil?
      dslx.children.delete_all!
      dslx.add addit
      trans = XML::Smart::open_unprotected(@opts[:transformation_dslx])
      dsl.text = dslx.to_doc.transform_with(trans)
      @instance.description = dsl.text
    end

    ### dataelements extraction
    addit = if tdatatype == 'rest' && !tdata.empty?
      srv = Riddl::Client.interface(tdata.text,@opts[:transformation_service])
      status, res = srv.post [
        Riddl::Parameter::Complex.new("description","text/xml",desc.children.first.dump),
        Riddl::Parameter::Simple.new("type","dataelements")
      ]
      if status >= 200 && status < 300
        res
      else
        raise 'Could not extract dataelements'
      end
    elsif tdatatype == 'xslt' && !tdata.empty?
      trans = XML::Smart::open_unprotected(tdata.text)
      desc.children.first.to_doc.transform_with(trans)
    elsif tdatatype == 'clean'
      []
    else
      nil
    end
    unless addit.nil?
      dslx.children.delete_all!
      dslx.add addit
      trans = XML::Smart::open_unprotected(@opts[:transformation_dslx])
      dsl.text = dslx.to_doc.transform_with(trans)
      @instance.description = dsl.text
    end

    ### dataelements extraction
    addit = if tdatatype == 'rest' && !tdata.empty?
      srv = Riddl::Client.interface(tdata.text,@opts[:transformation_service])
      status, res = srv.post [
        Riddl::Parameter::Complex.new("description","text/xml",desc.children.first.dump),
        Riddl::Parameter::Simple.new("type","dataelements")
      ]
      if status >= 200 && status < 300
        res
      else
        raise 'Could not extract dataelements'
      end
    elsif tdatatype == 'xslt' && !tdata.empty?
      trans = XML::Smart::open_unprotected(tdata.text)
      desc.children.first.to_doc.transform_with(trans)
    elsif tdatatype == 'clean'
      []
    else
      nil
    end
    unless addit.nil?
      node = doc.find("/p:properties/p:dataelements").first
      node.children.delete_all!
      @instance.data.clear
      addit.each_slice(2).each do |k,v|
        @instance.data[k.value.to_sym] = ValueHelper::parse(v.value)
        node.add(k.value,ValueHelper::generate(v.value))
      end
      nots << ["dataelements/change", {:instance => instance, :changed => JSON::generate(@instance.data)}]
    end

    ### endpoints extraction
    addit = if tendptype == 'rest' && !tdata.empty?
      srv = Riddl::Client.interface(tendp.text,@opts[:transformation_service])
      status, res = srv.post [
        Riddl::Parameter::Complex.new("description","text/xml",desc.children.first.dump),
        Riddl::Parameter::Simple.new("type","endpoints")
      ]
      if status >= 200 && status < 300
        res
      else
        raise 'Could not extract endpoints'
      end
    elsif tendptype == 'xslt' && !tdata.empty?
      trans = XML::Smart::open_unprotected(tendp.text)
      desc.children.first.to_doc.transform_with(trans)
    elsif tendptype == 'clean'
      []
    else
      nil
    end
    unless addit.nil?
      node = doc.find("/p:properties/p:endpoints").first
      node.children.delete_all!
      @instance.endpoints.clear
      addit.each_slice(2).each do |k,v|
        @instance.endpoints[k.value.to_sym] = ValueHelper::parse(v.value)
        node.add(k.value,ValueHelper::generate(v.value))
      end
      nots << ["endpoints/change", {:instance => instance, :changed => JSON::generate(@instance.endpoints)}]
    end
    nots << ["description/change", { :instance => instance }]
  rescue => err
    nots << ["description/error", { :instance => instance, :message => err.message }]
  end
  nots
end
