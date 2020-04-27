class Instance < WEEL
  handlerwrapper DefaultHandlerWrapper

  endpoint :timeout => "http://gruppe.wst.univie.ac.at/~mangler/services/timeout.php"
  data :x => ''
  search Position.new(:a2,:after,nil), Position.new(:a1,:after,nil)

  control flow do
    call :a1, :timeout, parameters: { :label => "Step 1", :method => :post, :arguments => [⭐(:name => :timeout, :value => ->{ "2" })] }, finalize: <<-END
      p 'xxx1'
			data.x += \"a1,\"
		END
		call :a2, :timeout, parameters: { :label => "Step 2", :method => :post, :arguments => [⭐(:name => :timeout, :value => ->{ "4" })] }, finalize: <<-END
      p 'xxx2'
			data.x += \"a2,\"
		END
		call :a3, :timeout, parameters: { :label => "Step 3", :method => :post, :arguments => [⭐(:name => :timeout, :value => ->{ "4" })] }, finalize: <<-END
      p 'xxx3'
			data.x += \"a3,\"
		END
  end
end

