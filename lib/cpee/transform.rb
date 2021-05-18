def transform(descxml,tdesc,tdesctype,tdata,tdatatype,tendp,tendptype,opts)
  desc = XML::Smart::string(descxml)
  desc.register_namespace  'p', 'http://cpee.org/ns/description/1.0'

  dslx = nil
  dsl = nil
  de = {}
  ep = {}

  if desc.root.children.empty?
    tdesctype = tdatatype = tendptype = 'clean'
  end

  ### description transformation, including dslx to dsl
  addit = if tdesctype == 'copy' || tdesc.empty?
    desc
  elsif tdesctype == 'rest' && !tdesc.empty?
    srv = Riddl::Client.interface(tdesc,opts[:transformation_service])
    status, res = srv.post [
      Riddl::Parameter::Complex.new("description","text/xml",descxml),
      Riddl::Parameter::Simple.new("type","description")
    ]
    if status >= 200 && status < 300
      XML::Smart::string(res[0].value.read).root
    else
      raise 'Could not extract dslx'
    end
  elsif tdesctype == 'xslt' && !tdesc.empty?
    trans = XML::Smart::open_unprotected(tdesc)
    desc.transform_with(trans).root
  elsif tdesctype == 'clean'
    XML::Smart::open_unprotected(opts[:empty_dslx]).root
  else
    nil
  end
  unless addit.nil?
    dslx = addit.to_s
    dsl = CPEE::ExecutionHandler::Ruby::dslx_to_dsl(addit)
  end

  ### dataelements extraction
  addit = if tdatatype == 'rest' && !tdata.empty?
    srv = Riddl::Client.interface(tdata,@opts[:transformation_service])
    status, res = srv.post [
      Riddl::Parameter::Complex.new("description","text/xml",descxml),
      Riddl::Parameter::Simple.new("type","dataelements")
    ]
    if status >= 200 && status < 300
      res
    else
      raise 'Could not extract dataelements'
    end
  elsif tdatatype == 'xslt' && !tdata.empty?
    trans = XML::Smart::open_unprotected(tdata)
    desc.transform_with(trans)
  elsif tdatatype == 'clean'
    []
  else
    nil
  end
  unless addit.nil?
    addit.each_slice(2).each do |k,v|
      de[k.value.to_sym] = v.value
    end
  end

  ### endpoints extraction
  addit = if tendptype == 'rest' && !tdata.empty?
    srv = Riddl::Client.interface(tendp,@opts[:transformation_service])
    status, res = srv.post [
      Riddl::Parameter::Complex.new("description","text/xml",descxml),
      Riddl::Parameter::Simple.new("type","endpoints")
    ]
    if status >= 200 && status < 300
      res
    else
      raise 'Could not extract endpoints'
    end
  elsif tendptype == 'xslt' && !tdata.empty?
    trans = XML::Smart::open_unprotected(tendp.text)
    desc.transform_with(trans)
  elsif tendptype == 'clean'
    []
  else
    nil
  end
  unless addit.nil?
    addit.each_slice(2).each do |k,v|
      ep[k.value.to_sym] = v.value
    end
  end

  [dslx, dsl, de, ep]
end
